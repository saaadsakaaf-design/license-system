'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Key, 
  Users, 
  DollarSign, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  PlusCircle,
  Phone,
  Calendar
} from 'lucide-react';

interface License {
  id: number;
  license_key: string;
  clinic_name: string;
  email: string;
  customer_phone?: string;
  plan_code: string;
  max_devices: number;
  amount: number;
  payment_status: 'paid' | 'pending' | 'trial';
  status: 'active' | 'expired' | 'suspended';
  expires_at: string;
  created_at: string;
}

export default function Dashboard() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    clinicName: '',
    email: '',
    customerPhone: '',
    planCode: 'Annual',
    maxDevices: 1,
    amount: 200,
    paymentStatus: 'paid'
  });

  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stats calculation
  const totalRevenue = licenses.reduce((sum, item) => sum + (item.payment_status === 'paid' ? Number(item.amount || 0) : 0), 0);
  const activeLicenses = licenses.filter(l => l.status === 'active').length;
  const pendingPayments = licenses.filter(l => l.payment_status === 'pending').length;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setGeneratedKey(null);

    try {
      const res = await fetch('/api/generate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.licenseKey) {
        setGeneratedKey(data.licenseKey);
        fetchLicenses();
      } else {
        setErrorMsg(data.message || 'Error generating license key');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to cloud server');
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenses = async () => {
    try {
      const res = await fetch('/api/verify-license/list');
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
      }
    } catch (e) {
      console.log('List fetch endpoint not active yet');
    }
  };

  const filteredLicenses = licenses.filter(item => 
    item.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.customer_phone && item.customer_phone.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-slate-50 dir-ltr p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">License & Financial Management System</h1>
            <p className="text-slate-500 text-sm mt-1">Manage clinic subscriptions, cloud licenses, and payments</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Server Connected
          </span>
        </div>

        {/* Financial & Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">${totalRevenue}</h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Licenses</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeLicenses}</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Payments</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingPayments}</h3>
            </div>
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Devices Allowed</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {licenses.reduce((acc, curr) => acc + (curr.max_devices || 1), 0)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Create License Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Generate New License & Record Payment</h2>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Clinic Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Al-Amal Dental Clinic"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={formData.clinicName}
                onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="doctor@clinic.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Customer Phone / ID</label>
              <input
                type="text"
                placeholder="+252 61 XXX XXXX"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={formData.customerPhone}
                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subscription Plan</label>
              <select
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={formData.planCode}
                onChange={e => setFormData({ ...formData, planCode: e.target.value })}
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual (1 Year)</option>
                <option value="Lifetime">Lifetime</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount ($)</label>
              <input
                type="number"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Status</label>
              <select
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={formData.paymentStatus}
                onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as any })}
              >
                <option value="paid">Paid 🟢</option>
                <option value="pending">Pending 🟡</option>
                <option value="trial">Trial 🔵</option>
              </select>
            </div>

            <div className="md:col-span-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Generating Key...' : 'Generate License & Save Record'}
              </button>
            </div>
          </form>

          {/* Key Output Result */}
          {generatedKey && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-semibold">License Key Generated Successfully:</p>
                <p className="text-lg font-mono font-bold text-emerald-900 mt-0.5">{generatedKey}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedKey)}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition"
              >
                Copy Key
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        {/* License & Subscriptions List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Registered Licenses & Subscriptions</h2>
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by clinic, key, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Clinic / Email</th>
                  <th className="p-3">Customer Phone</th>
                  <th className="p-3">License Key</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No licenses found
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map(lic => (
                    <tr key={lic.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-800">
                        {lic.clinic_name}
                        <div className="text-[10px] text-slate-400 font-normal">{lic.email}</div>
                      </td>
                      <td className="p-3 text-slate-600">{lic.customer_phone || '-'}</td>
                      <td className="p-3 font-mono font-medium text-slate-700">{lic.license_key}</td>
                      <td className="p-3">{lic.plan_code}</td>
                      <td className="p-3 font-bold text-slate-800">${lic.amount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lic.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          lic.payment_status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {lic.payment_status === 'paid' ? 'Paid' : lic.payment_status === 'pending' ? 'Pending' : 'Trial'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lic.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {lic.status === 'active' ? 'Active 🟢' : 'Expired 🔴'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
