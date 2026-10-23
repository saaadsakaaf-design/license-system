'use client';

import { useState } from 'react';

export default function Dashboard() {
  // Generate License Form States
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [planCode, setPlanCode] = useState('annual');
  const [maxDevices, setMaxDevices] = useState(2);
  const [generatedKey, setGeneratedKey] = useState('');
  const [genError, setGenError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Verify License Form States
  const [verifyKey, setVerifyKey] = useState('');
  const [hardwareId, setHardwareId] = useState('HWID-CLINIC-PC-01');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Handle Generating License
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError('');
    setGeneratedKey('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_name: clinicName,
          email,
          plan_code: planCode,
          max_devices: Number(maxDevices),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.license_key);
        setVerifyKey(data.license_key); // Auto-fill the verification form for convenience
      } else {
        setGenError(data.message || 'Failed to generate license');
      }
    } catch (err) {
      setGenError('Server error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Verifying License
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifyResult(null);
    setIsVerifying(true);

    try {
      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: verifyKey,
          hardware_id: hardwareId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVerifyResult(data);
      } else {
        setVerifyError(data.message || 'Verification failed');
      }
    } catch (err) {
      setVerifyError('Server error occurred');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-slate-900 border-b pb-4">
          Clinic License Management System
        </h1>

        {/* Section 1: Generate License */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">1. Generate New License</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Clinic Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Al-Noor Dental Clinic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clinic@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Plan Code</label>
                <select
                  className="mt-1 block w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                >
                  <option value="demo">Demo (30 Days)</option>
                  <option value="annual">Annual (1 Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Max Allowed Devices</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  className="mt-1 block w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={maxDevices}
                  onChange={(e) => setMaxDevices(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium"
            >
              {isGenerating ? 'Generating...' : 'Generate License Key'}
            </button>
          </form>

          {genError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
              {genError}
            </div>
          )}

          {generatedKey && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800">Generated License Key:</p>
              <p className="text-lg font-mono font-bold text-green-900 mt-1 select-all">{generatedKey}</p>
            </div>
          )}
        </div>

        {/* Section 2: Test Verify License */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">2. Test Verify License API</h2>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">License Key</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                  value={verifyKey}
                  onChange={(e) => setVerifyKey(e.target.value)}
                  placeholder="LIC-XXXXX-XXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Hardware ID (Device Identifier)</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
                  value={hardwareId}
                  onChange={(e) => setHardwareId(e.target.value)}
                  placeholder="HWID-12345"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-300 font-medium"
            >
              {isVerifying ? 'Verifying...' : 'Verify License'}
            </button>
          </form>

          {verifyError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
              ❌ {verifyError}
            </div>
          )}

          {verifyResult && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-1">
              <p className="text-sm font-bold text-emerald-800">✅ Verification Successful!</p>
              <p className="text-sm text-emerald-900"><strong>Clinic Name:</strong> {verifyResult.clinic_name}</p>
              <p className="text-sm text-emerald-900"><strong>Expires At:</strong> {new Date(verifyResult.expires_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}