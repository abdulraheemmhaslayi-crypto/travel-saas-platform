'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Loading from '@/components/common/Loading';
import Switch from '@/components/ui/Switch';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { Edit2, Trash2, Plus, Shield, Key, Settings, Check } from 'lucide-react';

function AdminSettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useAppStore();

  const tab = searchParams.get('tab') || 'platform';

  const setTab = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Platform settings state
  const [commission, setCommission] = useState('15');
  const [platformActive, setPlatformActive] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // RBAC Roles State
  const [roles, setRoles] = useState<any[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', hierarchyLevel: 0 });
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  // RBAC Permissions State
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isPermsLoading, setIsPermsLoading] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState<any>(null);
  const [permForm, setPermForm] = useState({ name: '', code: '', module: '', action: '', description: '' });
  const [isDeletePermOpen, setIsDeletePermOpen] = useState(false);
  const [permToDelete, setPermToDelete] = useState<any>(null);

  // Role Permissions mapping State
  const [selectedMappingRoleId, setSelectedMappingRoleId] = useState('');
  const [checkedPermissions, setCheckedPermissions] = useState<Record<string, boolean>>({});

  const handleUpdateCommission = async () => {
    setIsLoading(true);
    try {
      await apiClient.updateCommission({ percentage: Number(commission) });
      showToast('Commission updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to update commission', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setIsLoading(true);
    try {
      await apiClient.updateAdminSettings({
        platformActive,
        notificationsEnabled,
      });
      showToast('Settings updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to update settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Roles
  const loadRoles = async () => {
    setIsRolesLoading(true);
    try {
      const res = await apiClient.getAdminRoles();
      setRoles(res.data || res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load roles', 'error');
    } finally {
      setIsRolesLoading(false);
    }
  };

  // Fetch Permissions
  const loadPermissions = async () => {
    setIsPermsLoading(true);
    try {
      const res = await apiClient.getAdminPermissions();
      setPermissions(res.data || res);
    } catch (err: any) {
      showToast(err.message || 'Failed to load permissions', 'error');
    } finally {
      setIsPermsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'roles') {
      loadRoles();
    } else if (tab === 'permissions') {
      loadPermissions();
    } else if (tab === 'role-permissions') {
      loadRoles();
      loadPermissions();
    }
  }, [tab]);

  // Set default selected mapping role once loaded
  useEffect(() => {
    if (roles.length > 0 && !selectedMappingRoleId) {
      setSelectedMappingRoleId(roles[0].id);
    }
  }, [roles, selectedMappingRoleId]);

  // Set checked permissions when mapped role changes
  useEffect(() => {
    const activeRole = roles.find((r) => r.id === selectedMappingRoleId);
    if (activeRole && activeRole.permissions) {
      const checked: Record<string, boolean> = {};
      activeRole.permissions.forEach((p: any) => {
        checked[p.id] = true;
      });
      setCheckedPermissions(checked);
    } else {
      setCheckedPermissions({});
    }
  }, [selectedMappingRoleId, roles]);

  const handleAddRole = () => {
    setSelectedRole(null);
    setRoleForm({ name: '', description: '', hierarchyLevel: 0 });
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      hierarchyLevel: role.hierarchyLevel || 0,
    });
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (selectedRole) {
        await apiClient.updateAdminRole(selectedRole.id, roleForm);
        showToast('Role updated successfully', 'success');
      } else {
        await apiClient.createAdminRole(roleForm);
        showToast('Role created successfully', 'success');
      }
      setIsRoleModalOpen(false);
      loadRoles();
    } catch (err: any) {
      showToast(err.message || 'Failed to save role', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = (role: any) => {
    setRoleToDelete(role);
    setIsDeleteRoleOpen(true);
  };

  const confirmDeleteRole = async () => {
    setIsLoading(true);
    try {
      await apiClient.deleteAdminRole(roleToDelete.id);
      showToast('Role deleted successfully', 'success');
      setIsDeleteRoleOpen(false);
      loadRoles();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete role', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPermission = () => {
    setSelectedPerm(null);
    setPermForm({ name: '', code: '', module: '', action: '', description: '' });
    setIsPermModalOpen(true);
  };

  const handleEditPermission = (perm: any) => {
    setSelectedPerm(perm);
    setPermForm({
      name: perm.name,
      code: perm.code,
      module: perm.module || '',
      action: perm.action || '',
      description: perm.description || '',
    });
    setIsPermModalOpen(true);
  };

  const handlePermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (selectedPerm) {
        await apiClient.updateAdminPermission(selectedPerm.id, permForm);
        showToast('Permission updated successfully', 'success');
      } else {
        await apiClient.createAdminPermission(permForm);
        showToast('Permission created successfully', 'success');
      }
      setIsPermModalOpen(false);
      loadPermissions();
    } catch (err: any) {
      showToast(err.message || 'Failed to save permission', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePermission = (perm: any) => {
    setPermToDelete(perm);
    setIsDeletePermOpen(true);
  };

  const confirmDeletePermission = async () => {
    setIsLoading(true);
    try {
      await apiClient.deleteAdminPermission(permToDelete.id);
      showToast('Permission deleted successfully', 'success');
      setIsDeletePermOpen(false);
      loadPermissions();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete permission', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Group permissions by their 'module' field
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    permissions.forEach((perm) => {
      let moduleName = perm.module || 'General';
      if (!perm.module && perm.code.includes(':')) {
        moduleName = perm.code.split(':')[0];
        moduleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
      }
      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }
      groups[moduleName].push(perm);
    });
    return groups;
  }, [permissions]);

  const handleTogglePermission = (id: string) => {
    setCheckedPermissions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleModule = (moduleName: string, modulePerms: any[], allChecked: boolean) => {
    setCheckedPermissions((prev) => {
      const updated = { ...prev };
      modulePerms.forEach((p) => {
        if (allChecked) {
          updated[p.id] = false;
        } else {
          updated[p.id] = true;
        }
      });
      return updated;
    });
  };

  const handleSaveMappings = async () => {
    if (!selectedMappingRoleId) return;
    setIsLoading(true);
    try {
      const permissionIds = Object.keys(checkedPermissions).filter((id) => checkedPermissions[id]);
      await apiClient.updateRolePermissions(selectedMappingRoleId, permissionIds);
      showToast('Role permissions mapped successfully', 'success');
      loadRoles();
    } catch (err: any) {
      showToast(err.message || 'Failed to save mappings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const roleColumns = [
    { key: 'name', header: 'Role Name', sortable: true },
    { key: 'description', header: 'Description' },
    {
      key: 'hierarchyLevel',
      header: 'Hierarchy Level',
      sortable: true,
      render: (role: any) => (
        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
          Level {role.hierarchyLevel}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (role: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEditRole(role)} className="!p-1">
            <Edit2 className="w-4 h-4 text-gray-500 hover:text-primary-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeleteRole(role)} className="!p-1">
            <Trash2 className="w-4 h-4 text-gray-500 hover:text-danger-600" />
          </Button>
        </div>
      ),
    },
  ];

  const permissionColumns = [
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'code',
      header: 'Permission Code',
      sortable: true,
      render: (perm: any) => (
        <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
          {perm.code}
        </span>
      ),
    },
    { key: 'module', header: 'Module', sortable: true },
    { key: 'description', header: 'Description' },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (perm: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEditPermission(perm)} className="!p-1">
            <Edit2 className="w-4 h-4 text-gray-500 hover:text-primary-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeletePermission(perm)} className="!p-1">
            <Trash2 className="w-4 h-4 text-gray-500 hover:text-danger-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-1">Manage core platform rules, fees, roles, and permissions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'platform' && (
            <>
              <Button onClick={handleUpdateCommission} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Commission'}
              </Button>
              <Button onClick={handleUpdateSettings} variant="secondary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </>
          )}
          {tab === 'roles' && (
            <Button onClick={handleAddRole} leftIcon={<Plus className="w-4 h-4" />}>
              Add Role
            </Button>
          )}
          {tab === 'permissions' && (
            <Button onClick={handleAddPermission} leftIcon={<Plus className="w-4 h-4" />}>
              Add Permission
            </Button>
          )}
          {tab === 'role-permissions' && (
            <Button onClick={handleSaveMappings} disabled={isLoading || !selectedMappingRoleId}>
              {isLoading ? 'Saving Mappings...' : 'Save Mappings'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'platform', name: 'Platform Settings' },
            { id: 'roles', name: 'Roles Management' },
            { id: 'permissions', name: 'Permissions' },
            { id: 'role-permissions', name: 'Role-Permissions Map' },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-150',
                  active
                    ? 'border-primary-600 text-primary-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {t.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      {tab === 'platform' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <div className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Commission</h2>
                <p className="text-sm text-gray-500">Set the global commission percentage for platform bookings.</p>
              </div>
              <Input
                label="Commission Rate (%)"
                type="number"
                min={0}
                max={100}
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
              <p className="text-sm text-gray-500">Current value is applied to future transactions.</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Platform Status</h2>
                <p className="text-sm text-gray-500">Toggle whether booking flows are available on the platform.</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-900">Platform is {platformActive ? 'Active' : 'Paused'}</span>
                <Switch checked={platformActive} onCheckedChange={setPlatformActive} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500">Control whether system alerts should be sent to admins.</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-gray-900">Notifications enabled</span>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'roles' && (
        <Card className="p-6">
          <Table
            columns={roleColumns}
            data={roles}
            keyExtractor={(role) => role.id}
            isLoading={isRolesLoading}
            emptyMessage="No roles configured. Click Add Role to create one."
          />
        </Card>
      )}

      {tab === 'permissions' && (
        <Card className="p-6">
          <Table
            columns={permissionColumns}
            data={permissions}
            keyExtractor={(perm) => perm.id}
            isLoading={isPermsLoading}
            emptyMessage="No permissions configured. Click Add Permission to create one."
          />
        </Card>
      )}

      {tab === 'role-permissions' && (
        <div className="space-y-6">
          <Card className="p-6 max-w-xl">
            <Select
              label="Select Role to Map"
              options={roles.map((r) => ({ value: r.id, label: `${r.name} (Level ${r.hierarchyLevel})` }))}
              value={selectedMappingRoleId}
              onChange={(e) => setSelectedMappingRoleId(e.target.value)}
              placeholder={isRolesLoading ? 'Loading roles...' : 'Choose a role...'}
            />
          </Card>

          {selectedMappingRoleId && (
            <Card className="p-6">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Permissions Checklist</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Select permissions to assign to the selected role. Grouped by system module.
                  </p>
                </div>

                {isPermsLoading ? (
                  <Loading text="Loading permissions checklist..." />
                ) : Object.keys(groupedPermissions).length === 0 ? (
                  <p className="text-gray-500 text-sm">No permissions available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                      const allChecked = modulePerms.every((p) => checkedPermissions[p.id]);
                      const someChecked = modulePerms.some((p) => checkedPermissions[p.id]) && !allChecked;

                      return (
                        <div key={moduleName} className="border border-gray-100 rounded-xl p-5 space-y-4 bg-gray-50/50">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h4 className="font-semibold text-gray-900">{moduleName}</h4>
                            <button
                              type="button"
                              onClick={() => handleToggleModule(moduleName, modulePerms, allChecked)}
                              className="text-xs text-primary-600 hover:text-primary-800 font-semibold"
                            >
                              {allChecked ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          <div className="space-y-3">
                            {modulePerms.map((perm) => (
                              <label
                                key={perm.id}
                                className="flex items-start gap-3 cursor-pointer group select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!checkedPermissions[perm.id]}
                                  onChange={() => handleTogglePermission(perm.id)}
                                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {perm.name}
                                  </span>
                                  <span className="block text-xs text-gray-400 font-mono mt-0.5">
                                    {perm.code}
                                  </span>
                                  {perm.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Role Create/Edit Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={selectedRole ? 'Edit Role' : 'Add Role'}
        description={selectedRole ? 'Update role parameters' : 'Create a new role in the platform'}
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          <Input
            label="Role Name"
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            placeholder="e.g. Finance Manager"
            required
          />
          <Input
            label="Description"
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            placeholder="Short details about role duties"
          />
          <Input
            label="Hierarchy Level"
            type="number"
            min={0}
            value={roleForm.hierarchyLevel}
            onChange={(e) => setRoleForm({ ...roleForm, hierarchyLevel: parseInt(e.target.value) || 0 })}
            placeholder="0"
            required
            helperText="Lower numbers indicate higher platform hierarchy"
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Role Modal */}
      <Modal
        isOpen={isDeleteRoleOpen}
        onClose={() => setIsDeleteRoleOpen(false)}
        title="Delete Role"
        description="Are you absolutely sure you want to delete this role? This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Deleting <strong className="text-gray-900">{roleToDelete?.name}</strong> will remove it from all assigned users and delete associated permissions mapping.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsDeleteRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={confirmDeleteRole} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permission Create/Edit Modal */}
      <Modal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        title={selectedPerm ? 'Edit Permission' : 'Add Permission'}
        description={selectedPerm ? 'Update permission parameters' : 'Create a new custom permission'}
      >
        <form onSubmit={handlePermSubmit} className="space-y-4">
          <Input
            label="Permission Name"
            value={permForm.name}
            onChange={(e) => setPermForm({ ...permForm, name: e.target.value })}
            placeholder="e.g. Initiate Refund"
            required
          />
          <Input
            label="Permission Code"
            value={permForm.code}
            onChange={(e) => setPermForm({ ...permForm, code: e.target.value })}
            placeholder="e.g. payment:refund"
            required
            disabled={!!selectedPerm}
          />
          <Input
            label="Module"
            value={permForm.module}
            onChange={(e) => setPermForm({ ...permForm, module: e.target.value })}
            placeholder="e.g. Payments"
            required
          />
          <Input
            label="Action"
            value={permForm.action}
            onChange={(e) => setPermForm({ ...permForm, action: e.target.value })}
            placeholder="e.g. refund"
            required
          />
          <Input
            label="Description"
            value={permForm.description}
            onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
            placeholder="What does this permission allow"
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsPermModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Permission'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Permission Modal */}
      <Modal
        isOpen={isDeletePermOpen}
        onClose={() => setIsDeletePermOpen(false)}
        title="Delete Permission"
        description="Are you absolutely sure you want to delete this permission?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Deleting <strong className="text-gray-900">{permToDelete?.name}</strong> will remove it from all roles mapped to it.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setIsDeletePermOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={confirmDeletePermission} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN" allowedUserTypes="SUPER_ADMIN">
      <Suspense fallback={<Loading text="Loading settings..." />}>
        <AdminSettingsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
