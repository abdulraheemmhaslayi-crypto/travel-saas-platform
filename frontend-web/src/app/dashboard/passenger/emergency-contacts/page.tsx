'use client';

import React, { useState } from 'react';
import { usePassengerStore } from '@/store/slices/passengerStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/common/EmptyState';
import {
  Phone,
  Plus,
  Trash2,
  Edit3,
  Shield,
  AlertTriangle,
  UserPlus,
  Users,
} from 'lucide-react';

export default function EmergencyContactsPage() {
  const { emergencyContacts, addEmergencyContact, updateEmergencyContact, removeEmergencyContact } = usePassengerStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return;

    if (editId) {
      updateEmergencyContact(editId, {
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim() || undefined,
      });
    } else {
      addEmergencyContact({
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim() || undefined,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setRelationship('');
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (id: string) => {
    const contact = emergencyContacts.find((c) => c.id === id);
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone);
      setRelationship(contact.relationship || '');
      setEditId(id);
      setShowForm(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-red-100">
              <Phone className="w-5 h-5 text-red-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Emergency Contacts</h1>
          </div>
          <p className="text-sm text-gray-500">
            People to contact in case of emergency during your trips
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* SOS Info Card */}
      <Card>
        <div className="p-4 flex items-start gap-3 bg-red-50/50">
          <div className="p-2 rounded-xl bg-red-100 shrink-0">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800">Emergency SOS</h3>
            <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
              During an active trip, you can use the SOS feature to alert your emergency contacts
              and our support team. Your live location will be shared with them automatically.
            </p>
          </div>
        </div>
      </Card>

      {/* Contacts List */}
      {emergencyContacts.length === 0 ? (
        <EmptyState
          title="No emergency contacts"
          description="Add emergency contacts who can be notified during your trips if needed."
          customIcon={<Users className="w-8 h-8 text-gray-400" />}
          action={{
            label: 'Add Emergency Contact',
            onClick: () => setShowForm(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all duration-200 p-4 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{contact.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{contact.phone}</span>
                  {contact.relationship && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{contact.relationship}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(contact.id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeEmergencyContact(contact.id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editId ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || !phone.trim()}>
              {editId ? 'Save Changes' : 'Add Contact'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter contact name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Users className="w-4 h-4" />}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+91 XXXXX XXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            required
          />
          <Select
            label="Relationship (optional)"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            options={[
              { value: '', label: 'Select relationship' },
              { value: 'Spouse', label: 'Spouse' },
              { value: 'Parent', label: 'Parent' },
              { value: 'Sibling', label: 'Sibling' },
              { value: 'Friend', label: 'Friend' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
