"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Header from "@/components/Header";
import {
  IconSettings,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChartBar,
  IconFileText,
  IconShield,
} from "@tabler/icons-react";

type PolicyType =
  | "prohibited_terms"
  | "required_disclosures"
  | "content_restrictions"
  | "risk_thresholds";

interface Policy {
  id: string;
  name: string;
  type: PolicyType;
  config: any;
  enabled: boolean;
}

interface Violation {
  policyId: string;
  policyName: string;
  policyType: PolicyType;
  violation: string;
  severity: "low" | "medium" | "high" | "critical";
  details?: Record<string, any>;
}

interface RiskScoreData {
  totalScore: number;
  factors: Record<string, number>;
  breakdown: Array<{
    factor: string;
    score: number;
    weight: number;
    contribution: number;
  }>;
}

export default function CompliancePage() {
  const { data: session } = useSession();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "policies" | "violations" | "risk-scores"
  >("overview");
  const [selectedPolicyType, setSelectedPolicyType] =
    useState<PolicyType | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    if (session) {
      fetchPolicies();
      fetchRecentViolations();
    }
  }, [session]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch("/api/policies");
      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentViolations = async () => {
    try {
      // This would fetch recent violations from content
      // For now, we'll show a placeholder
      setViolations([]);
    } catch (error) {
      console.error("Failed to fetch violations:", error);
    }
  };

  const handleSavePolicy = async (policy: Partial<Policy>) => {
    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policy),
      });

      if (!response.ok) {
        throw new Error("Failed to save policy");
      }

      await fetchPolicies();
      setShowPolicyModal(false);
      setEditingPolicy(null);
    } catch (error) {
      console.error("Failed to save policy:", error);
      alert("Failed to save policy");
    }
  };

  const handleDeletePolicy = async (policyName: string) => {
    if (!confirm(`Are you sure you want to delete policy "${policyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/policies?name=${policyName}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete policy");
      }

      await fetchPolicies();
    } catch (error) {
      console.error("Failed to delete policy:", error);
      alert("Failed to delete policy");
    }
  };

  const user = session?.user as any;
  const isAdvisor = user?.role === "advisor";

  if (!isAdvisor) {
    return (
      <div className="min-h-screen bg-light">
        <Header tenant={user?.tenant} user={user} signOut={signOut} />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center py-12 text-gray-500">
            Access denied. Only advisors can view the compliance dashboard.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light">
        <Header tenant={user?.tenant} user={user} signOut={signOut} />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center">Loading compliance dashboard...</div>
        </div>
      </div>
    );
  }

  const policyTypes: PolicyType[] = [
    "prohibited_terms",
    "required_disclosures",
    "content_restrictions",
    "risk_thresholds",
  ];

  const policyTypeLabels: Record<PolicyType, string> = {
    prohibited_terms: "Prohibited Terms",
    required_disclosures: "Required Disclosures",
    content_restrictions: "Content Restrictions",
    risk_thresholds: "Risk Thresholds",
  };

  return (
    <div className="min-h-screen bg-light">
      <Header tenant={user?.tenant} user={user} signOut={signOut} />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">Compliance Dashboard</h1>
          <button
            onClick={() => {
              setEditingPolicy(null);
              setSelectedPolicyType(null);
              setShowPolicyModal(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
          >
            <IconSettings size={20} className="inline mr-2" />
            New Policy
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("policies")}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === "policies"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Policies
            </button>
            <button
              onClick={() => setActiveTab("violations")}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === "violations"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Violations
            </button>
            <button
              onClick={() => setActiveTab("risk-scores")}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === "risk-scores"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Risk Scores
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Policies</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {policies.filter((p) => p.enabled).length}
                    </p>
                  </div>
                  <IconShield className="text-primary" size={32} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Recent Violations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {violations.length}
                    </p>
                  </div>
                  <IconAlertTriangle className="text-yellow-600" size={32} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Content Reviewed</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                  <IconCheck className="text-green-600" size={32} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Risk Score</p>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                  <IconChartBar className="text-blue-600" size={32} />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="text-gray-500 text-sm">
                Activity feed coming soon...
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === "policies" && (
          <div className="space-y-4">
            {policyTypes.map((type) => {
              const typePolicies = policies.filter((p) => p.type === type);
              return (
                <div
                  key={type}
                  className="bg-white rounded-lg shadow p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {policyTypeLabels[type]}
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedPolicyType(type);
                        setEditingPolicy(null);
                        setShowPolicyModal(true);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Add Policy
                    </button>
                  </div>

                  {typePolicies.length === 0 ? (
                    <div className="text-gray-500 text-sm py-4">
                      No policies configured. Click "Add Policy" to create one.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {typePolicies.map((policy) => (
                        <div
                          key={policy.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                policy.enabled
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {policy.enabled ? "Enabled" : "Disabled"}
                            </span>
                            <span className="font-medium">{policy.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingPolicy(policy);
                                setShowPolicyModal(true);
                              }}
                              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePolicy(policy.name)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === "violations" && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Policy Violations</h2>
            {violations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No violations found.
              </div>
            ) : (
              <div className="space-y-4">
                {violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded border ${
                      violation.severity === "critical"
                        ? "bg-red-50 border-red-200"
                        : violation.severity === "high"
                        ? "bg-orange-50 border-orange-200"
                        : violation.severity === "medium"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              violation.severity === "critical"
                                ? "bg-red-200 text-red-900"
                                : violation.severity === "high"
                                ? "bg-orange-200 text-orange-900"
                                : violation.severity === "medium"
                                ? "bg-yellow-200 text-yellow-900"
                                : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            {violation.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium">
                            {violation.policyName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {violation.violation}
                        </p>
                        {violation.details && (
                          <div className="mt-2 text-xs text-gray-600">
                            {JSON.stringify(violation.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Risk Scores Tab */}
        {activeTab === "risk-scores" && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Risk Score Analysis</h2>
            <div className="text-gray-500 text-sm">
              Risk score visualization and analytics coming soon...
            </div>
          </div>
        )}

        {/* Policy Modal */}
        {showPolicyModal && (
          <PolicyModal
            policy={editingPolicy}
            policyType={selectedPolicyType}
            onClose={() => {
              setShowPolicyModal(false);
              setEditingPolicy(null);
              setSelectedPolicyType(null);
            }}
            onSave={handleSavePolicy}
          />
        )}
      </div>
    </div>
  );
}

// Policy Configuration Modal Component
function PolicyModal({
  policy,
  policyType,
  onClose,
  onSave,
}: {
  policy: Policy | null;
  policyType: PolicyType | null;
  onClose: () => void;
  onSave: (policy: Partial<Policy>) => Promise<void>;
}) {
  const [name, setName] = useState(policy?.name || "");
  const [type, setType] = useState<PolicyType>(
    policy?.type || policyType || "prohibited_terms"
  );
  const [enabled, setEnabled] = useState(policy?.enabled ?? true);
  const [config, setConfig] = useState<any>(policy?.config || {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      type,
      config,
      enabled,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {policy ? "Edit Policy" : "New Policy"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <IconX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Policy Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Policy Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PolicyType)}
                className="w-full p-2 border border-gray-300 rounded"
                required
                disabled={!!policy}
              >
                <option value="prohibited_terms">Prohibited Terms</option>
                <option value="required_disclosures">
                  Required Disclosures
                </option>
                <option value="content_restrictions">
                  Content Restrictions
                </option>
                <option value="risk_thresholds">Risk Thresholds</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">
                  Enabled
                </span>
              </label>
            </div>

            {/* Policy-specific configuration */}
            {type === "prohibited_terms" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prohibited Terms (one per line)
                </label>
                <textarea
                  value={
                    (config.prohibitedTerms || []).join("\n") || ""
                  }
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      prohibitedTerms: e.target.value
                        .split("\n")
                        .map((t) => t.trim())
                        .filter((t) => t.length > 0),
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={6}
                  placeholder="guaranteed return&#10;risk-free&#10;no risk"
                />
              </div>
            )}

            {type === "risk_thresholds" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto-Approve Threshold (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.riskThresholds?.autoApprove || 30}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        riskThresholds: {
                          ...config.riskThresholds,
                          autoApprove: parseInt(e.target.value) || 30,
                        },
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Require Review Threshold (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.riskThresholds?.requireReview || 50}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        riskThresholds: {
                          ...config.riskThresholds,
                          requireReview: parseInt(e.target.value) || 50,
                        },
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block Content Threshold (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.riskThresholds?.blockContent || 80}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        riskThresholds: {
                          ...config.riskThresholds,
                          blockContent: parseInt(e.target.value) || 80,
                        },
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
              >
                Save Policy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

