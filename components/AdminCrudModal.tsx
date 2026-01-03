'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'checkbox' | 'tel';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  rows?: number;
  defaultValue?: any;
  helperText?: string;
}

export interface AdminCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  title: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  submitButtonText?: string;
  isEditing?: boolean;
}

export function AdminCrudModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData = {},
  submitButtonText = 'Save',
  isEditing = false,
}: AdminCrudModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update formData when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const newFormData = fields.reduce((acc, field) => {
        const value = initialData?.[field.name];
        acc[field.name] = value !== undefined && value !== null
          ? value
          : field.defaultValue ?? (field.type === 'checkbox' ? false : '');
        return acc;
      }, {} as Record<string, any>);
      setFormData(newFormData);
      setErrors({});
    }
  }, [isOpen, initialData, fields]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Invalid email format';
        }
      }

      if (field.type === 'tel' && formData[field.name]) {
        const phoneRegex = /^[0-9+\-\s()]*$/;
        if (!phoneRegex.test(formData[field.name])) {
          newErrors[field.name] = 'Invalid phone number format';
        }
      }

      if (field.min !== undefined && formData[field.name] < field.min) {
        newErrors[field.name] = `Minimum value is ${field.min}`;
      }

      if (field.max !== undefined && formData[field.name] > field.max) {
        newErrors[field.name] = `Maximum value is ${field.max}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ _general: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const error = errors[field.name];

    const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:ring-green-500 focus:border-green-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${field.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            rows={field.rows || 3}
            className={baseInputClasses}
          />
        );

      case 'select':
        return (
          <select
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            disabled={field.disabled}
            className={baseInputClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={field.name}
              checked={value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={field.disabled}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor={field.name} className="ml-2 block text-sm text-gray-900">
              {field.helperText || field.label}
            </label>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            min={field.min}
            max={field.max}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-500 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {errors._general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors._general}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  {field.type !== 'checkbox' && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  {renderField(field)}
                  {errors[field.name] && (
                    <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                  )}
                  {field.helperText && field.type !== 'checkbox' && (
                    <p className="mt-1 text-sm text-gray-500">{field.helperText}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
