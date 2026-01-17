// src/components/ProfileForm.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../auth/ToastContext";
import { useNavigate } from "react-router-dom";
import { degrees } from "../data/degrees";
import { specializations } from "../data/specializations";
import { colleges } from "../data/colleges";
import { skillsList } from "../data/skills";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

type Tab = "education" | "certification" | "skills";

interface DashboardData {
  academicProfile: {
    institution: string;
    degree: string;
    year: string;
    cgpa: string;
  };
  placementStatus: {
    role: string;
    company: string;
    type: string;
    joinDate: string;
  };
  certifications: Array<{
    id?: number;
    name: string;
    issuer: string;
  }>;
  skills: string[];
  lastUpdated: string;
}

const emptyDashboardData: DashboardData = {
  academicProfile: {
    institution: "",
    degree: "",
    year: "",
    cgpa: "",
  },
  placementStatus: {
    role: "",
    company: "",
    type: "",
    joinDate: "",
  },
  certifications: [],
  skills: [],
  lastUpdated: "",
};

const ProfileForm: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("education");
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(emptyDashboardData);
  const [isSaving, setIsSaving] = useState(false);

  // Education fields
  const [collegeSelect, setCollegeSelect] = useState("");
  const [collegeOther, setCollegeOther] = useState("");
  const [degree, setDegree] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [completionYear, setCompletionYear] = useState("");

  // Certification fields
  const [certName, setCertName] = useState("");
  const [certOrg, setCertOrg] = useState("");
  const [certIssueDate, setCertIssueDate] = useState("");

  // Skills fields
  const [newSkill, setNewSkill] = useState("");

  const formatNowLabel = () =>
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // Helper function for case-insensitive college matching
  const findCollegeMatch = (institution: string): { found: boolean; exactMatch: string } => {
    if (!institution) return { found: false, exactMatch: "" };

    const collegesLower = colleges.map(c => c.toLowerCase());
    const institutionLower = institution.toLowerCase();

    const index = collegesLower.indexOf(institutionLower);
    if (index !== -1) {
      return { found: true, exactMatch: colleges[index] };
    }
    return { found: false, exactMatch: "" };
  };

  // Load existing profile from backend (plus local skills/lastUpdated)
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !token) return;

      // read local dashboard (for skills / lastUpdated)
      let localSkills: string[] = [];
      let localLastUpdated = "";
      const savedLocal = localStorage.getItem(`dashboard_${user.email}`);
      if (savedLocal) {
        try {
          const parsed: DashboardData = JSON.parse(savedLocal);
          localSkills = parsed.skills || [];
          localLastUpdated = parsed.lastUpdated || "";
        } catch {
          // ignore
        }
      }

      try {
        const res = await fetch(`${API_BASE}/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log("DEBUG ProfileForm Load: Full response:", data);

          const edu = data.education;
          const certs = data.certifications || [];

          // IMPORTANT: Check for decrypted fields first
          const institution = edu?.decrypted_university || edu?.university || "";
          const degreeText = edu?.decrypted_degree || edu?.degree || "";
          const specializationText = edu?.decrypted_specialization || edu?.specialization || "";

          console.log("DEBUG ProfileForm Load: Extracted values:", {
            institution,
            degreeText,
            specializationText,
            cgpa: edu?.cgpa,
            year: edu?.year_of_completion
          });

          console.log("DEBUG ProfileForm Load: institution from backend:", institution);
          console.log("DEBUG ProfileForm Load: colleges list:", colleges);

          const updated: DashboardData = {
            academicProfile: {
              institution: institution,
              degree: degreeText,
              year: edu?.year_of_completion?.toString() || "",
              cgpa: edu?.cgpa?.toString() || "",
            },
            placementStatus: {
              role: "",
              company: "",
              type: "",
              joinDate: "",
            },
            certifications: certs.map((c: any) => ({
              id: c.id,
              name: c.cert_name,
              issuer: c.issuing_organization,
            })),
            skills: localSkills,
            lastUpdated: localLastUpdated,
          };

          setDashboardData(updated);

          // Prefill education form fields with DECRYPTED values
          setDegree(degreeText);
          setSpecialization(specializationText);
          setCgpa(edu?.cgpa?.toString() || "");
          setCompletionYear(edu?.year_of_completion?.toString() || "");

          // Check if university is in colleges list with case-insensitive matching
          if (institution) {
            const match = findCollegeMatch(institution);
            console.log("DEBUG ProfileForm Load: College match result:", match);
            if (match.found) {
              setCollegeSelect(match.exactMatch);
              setCollegeOther("");
            } else {
              setCollegeSelect("Other");
              setCollegeOther(institution);
            }
          } else {
            setCollegeSelect("");
            setCollegeOther("");
          }

          // sync localStorage for Dashboard usage
          localStorage.setItem(
            `dashboard_${user.email}`,
            JSON.stringify(updated)
          );
        } else if (savedLocal) {
          const parsed: DashboardData = JSON.parse(savedLocal);
          setDashboardData(parsed);
          setDegree(parsed.academicProfile.degree || "");
          setSpecialization("");
          setCgpa(parsed.academicProfile.cgpa || "");
          setCompletionYear(parsed.academicProfile.year || "");

          // Check if university is in colleges list with case-insensitive matching
          if (parsed.academicProfile.institution) {
            const match = findCollegeMatch(parsed.academicProfile.institution);
            if (match.found) {
              setCollegeSelect(match.exactMatch);
              setCollegeOther("");
            } else {
              setCollegeSelect("Other");
              setCollegeOther(parsed.academicProfile.institution);
            }
          } else {
            setCollegeSelect("");
            setCollegeOther("");
          }
        }
      } catch (err) {
        console.error("ProfileForm load error:", err);
        showToast("Failed to load profile. Using local data.", "error");
        if (savedLocal) {
          const parsed: DashboardData = JSON.parse(savedLocal);
          setDashboardData(parsed);
          setDegree(parsed.academicProfile.degree || "");
          setSpecialization("");
          setCgpa(parsed.academicProfile.cgpa || "");
          setCompletionYear(parsed.academicProfile.year || "");

          // Check if university is in colleges list with case-insensitive matching
          if (parsed.academicProfile.institution) {
            const match = findCollegeMatch(parsed.academicProfile.institution);
            if (match.found) {
              setCollegeSelect(match.exactMatch);
              setCollegeOther("");
            } else {
              setCollegeSelect("Other");
              setCollegeOther(parsed.academicProfile.institution);
            }
          } else {
            setCollegeSelect("");
            setCollegeOther("");
          }
        }
      }
    };

    loadProfile();
  }, [user, token, showToast, navigate]);

  if (!user) {
    return (
      <div className="profile-empty-state">
        <h2>You're not logged in</h2>
        <p>Please log in to update your profile.</p>
        <button
          className="profile-primary-btn"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  // ------- SAVE HANDLER (Education + Certifications; skills handled separately) -------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "education") {
      // Determine university value
      const universityValue = collegeSelect === "Other"
        ? collegeOther.trim()
        : collegeSelect;

      // basic required checks
      if (!degree || !specialization || !universityValue || !cgpa || !completionYear) {
        showToast("Please fill all required education fields.", "error");
        return;
      }

      // trim inputs
      const trimmedDegree = degree.trim();
      const trimmedSpec = specialization.trim();
      const trimmedUni = universityValue;
      const trimmedCgpa = cgpa.trim();
      const trimmedYear = completionYear.trim();

      // stronger validation
      const cgpaNum = parseFloat(trimmedCgpa);
      if (Number.isNaN(cgpaNum)) {
        showToast("CGPA must be a valid number.", "error");
        return;
      }
      if (cgpaNum < 0 || cgpaNum > 10) {
        showToast("CGPA must be between 0 and 10.", "error");
        return;
      }

      const yearNum = parseInt(trimmedYear, 10);
      if (Number.isNaN(yearNum)) {
        showToast("Year of completion must be a valid year (e.g. 2026).", "error");
        return;
      }
      if (yearNum < 2000 || yearNum > 2100) {
        showToast("Year of completion must be between 2000 and 2100.", "error");
        return;
      }

      if (!token) {
        showToast("Missing auth token. Please log in again.", "error");
        return;
      }

      try {
        setIsSaving(true);
        const nowLabel = formatNowLabel();

        console.log("DEBUG ProfileForm Save: Sending data:", {
          degree: trimmedDegree,
          specialization: trimmedSpec,
          university: trimmedUni,
          cgpa: trimmedCgpa,
          year_of_completion: trimmedYear,
        });

        const res = await fetch(`${API_BASE}/profile/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // Send data at root level (not nested under "education")
          body: JSON.stringify({
            degree: trimmedDegree,
            specialization: trimmedSpec,
            university: trimmedUni,
            cgpa: trimmedCgpa,
            year_of_completion: trimmedYear,
            skills: skillsList,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Education save error:", errText);
          try {
            const errJson = JSON.parse(errText);
            showToast(`Failed to save: ${errJson.detail || JSON.stringify(errJson)}`, "error");
          } catch {
            showToast("Failed to save education details.", "error");
          }
          return;
        }

        const responseData = await res.json();
        console.log("DEBUG ProfileForm Save: Response:", responseData);

        // Update local state immediately after successful save
        const updated: DashboardData = {
          ...dashboardData,
          academicProfile: {
            institution: trimmedUni,
            degree: trimmedDegree,
            year: String(yearNum),
            cgpa: cgpaNum.toFixed(2),
          },
          lastUpdated: nowLabel,
        };

        setDashboardData(updated);

        // Update form fields to match the saved data
        setDegree(trimmedDegree);
        setSpecialization(trimmedSpec);
        setCgpa(trimmedCgpa);
        setCompletionYear(trimmedYear);

        // Update college selection based on saved university with case-insensitive matching
        const match = findCollegeMatch(trimmedUni);
        if (match.found) {
          setCollegeSelect(match.exactMatch);
          setCollegeOther("");
        } else {
          setCollegeSelect("Other");
          setCollegeOther(trimmedUni);
        }

        localStorage.setItem(
          `dashboard_${user.email}`,
          JSON.stringify(updated)
        );
        showToast("Education details saved successfully!", "success");
      } catch (err) {
        console.error("Save error:", err);
        showToast("Something went wrong while saving education.", "error");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    if (activeTab === "certification") {
      if (!certName || !certOrg || !certIssueDate) {
        showToast("Please fill all required certification fields.", "error");
        return;
      }

      if (!token) {
        showToast("Missing auth token. Please log in again.", "error");
        return;
      }

      try {
        setIsSaving(true);
        const nowLabel = formatNowLabel();

        const res = await fetch(`${API_BASE}/profile/certifications/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cert_name: certName.trim(),
            issuing_organization: certOrg.trim(),
            issue_date: certIssueDate.trim(),
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          console.error("Certification save error:", errJson);
          showToast("Failed to add certification.", "error");
          return;
        }

        const created = await res.json();
        const newCert = {
          id: created.id as number | undefined,
          name: created.cert_name as string,
          issuer: created.issuing_organization as string,
        };

        const updated: DashboardData = {
          ...dashboardData,
          certifications: [...dashboardData.certifications, newCert],
          lastUpdated: nowLabel,
        };

        setDashboardData(updated);
        localStorage.setItem(
          `dashboard_${user.email}`,
          JSON.stringify(updated)
        );

        showToast("Certification added!", "success");

        // clear form
        setCertName("");
        setCertOrg("");
        setCertIssueDate("");
      } catch (err) {
        console.error(err);
        showToast("Something went wrong while saving certification.", "error");
      } finally {
        setIsSaving(false);
      }

      return;
    }

    // Skills tab: nothing special on Save button (skills saved on add/remove)
    if (activeTab === "skills") {
      if (!token) {
        showToast("Please login again.", "error");
        return;
      }

      try {
        setIsSaving(true);

        console.log("DEBUG: Saving skills to backend:", dashboardData.skills);

        const res = await fetch(`${API_BASE}/profile/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            skills: dashboardData.skills, // ✅ THIS LINE FIXES EVERYTHING
          }),
        });

        if (!res.ok) {
          showToast("Failed to save skills.", "error");
          return;
        }

        showToast("Skills saved successfully!", "success");
      } catch (err) {
        console.error(err);
        showToast("Error saving skills.", "error");
      } finally {
        setIsSaving(false);
      }

      return;
    }


  };

  // ------- SKILLS HANDLERS -------
  const addSkillDirect = (skill: string) => {
    if (dashboardData.skills.includes(skill)) {
      showToast("This skill is already added.", "info");
      return;
    }

    const nowLabel = formatNowLabel();
    const updated: DashboardData = {
      ...dashboardData,
      skills: [...dashboardData.skills, skill],
      lastUpdated: nowLabel,
    };

    setDashboardData(updated);
    localStorage.setItem(`dashboard_${user.email}`, JSON.stringify(updated));
    showToast("Skill added!", "success");
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) {
      showToast("Please enter a skill first.", "error");
      return;
    }
    addSkillDirect(trimmed);
    setNewSkill("");
  };

  const handleRemoveSkill = (index: number) => {
    const newSkills = dashboardData.skills.filter((_, i) => i !== index);
    const nowLabel = formatNowLabel();

    const updated: DashboardData = {
      ...dashboardData,
      skills: newSkills,
      lastUpdated: nowLabel,
    };

    setDashboardData(updated);
    localStorage.setItem(`dashboard_${user.email}`, JSON.stringify(updated));
    showToast("Skill removed.", "info");
  };

  // ------- CERT REMOVE HANDLER -------
  const handleRemoveCertification = async (index: number) => {
    const cert = dashboardData.certifications[index];
    if (!cert) return;

    if (!token) {
      showToast("Missing auth token. Please log in again.", "error");
      return;
    }

    try {
      setIsSaving(true);

      if (cert.id) {
        const res = await fetch(
          `${API_BASE}/profile/certifications/${cert.id}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok && res.status !== 204) {
          showToast("Failed to delete certification from server.", "error");
          return;
        }
      }

      const newCerts = dashboardData.certifications.filter(
        (_, i) => i !== index
      );
      const nowLabel = formatNowLabel();

      const updated: DashboardData = {
        ...dashboardData,
        certifications: newCerts,
        lastUpdated: nowLabel,
      };

      setDashboardData(updated);
      localStorage.setItem(`dashboard_${user.email}`, JSON.stringify(updated));
      showToast("Certification removed.", "success");
    } catch (err) {
      console.error(err);
      showToast("Something went wrong while removing certification.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // ------- RENDER -------
  return (
    <div>
      {/* Tabs */}
      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab ${activeTab === "education" ? "active" : ""
            }`}
          onClick={() => setActiveTab("education")}
        >
          Education
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === "certification" ? "active" : ""
            }`}
          onClick={() => setActiveTab("certification")}
        >
          Certifications
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === "skills" ? "active" : ""
            }`}
          onClick={() => setActiveTab("skills")}
        >
          Skills
        </button>
      </div>

      <form className="profile-form" onSubmit={handleSave}>
        {activeTab === "education" && (
          <>
            <div className="profile-row">
              <div className="profile-field">
                <label>
                  Degree <span>*</span>
                </label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                >
                  <option value="">Select Degree</option>
                  {degrees.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="profile-field">
                <label>
                  Specialization <span>*</span>
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  disabled={!degree}
                >
                  <option value="">Select Specialization</option>
                  {specializations[degree]?.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>
                  University / College <span>*</span>
                </label>

                {/* DROPDOWN */}
                <select
                  value={collegeSelect}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCollegeSelect(value);
                    if (value !== "Other") {
                      setCollegeOther("");
                    }
                  }}
                >
                  <option value="">Select College</option>
                  {colleges.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>

                {/* EXTRA INPUT – only when Other is selected */}
                {collegeSelect === "Other" && (
                  <input
                    type="text"
                    value={collegeOther}
                    onChange={(e) => setCollegeOther(e.target.value)}
                    placeholder="Enter your college name"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>
                  CGPA <span>*</span>
                </label>
                <input
                  type="text"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.5"
                />
              </div>
              <div className="profile-field">
                <label>
                  Year of Completion <span>*</span>
                </label>
                <input
                  type="text"
                  value={completionYear}
                  onChange={(e) => setCompletionYear(e.target.value)}
                  placeholder="e.g. 2026"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "certification" && (
          <>
            {/* Existing certifications list */}
            {dashboardData.certifications.length > 0 && (
              <div className="profile-row">
                <div className="profile-field">
                  <label>Your certifications</label>
                  <div className="dashboard-certifications-list">
                    {dashboardData.certifications.map((cert, idx) => (
                      <div
                        key={cert.id ?? `${cert.name}-${idx}`}
                        className="dashboard-certification-item"
                      >
                        <div className="dashboard-info-row">
                          <div>
                            <div className="dashboard-info-label">Name</div>
                            <div className="dashboard-info-value">
                              {cert.name}
                            </div>
                          </div>
                          <div>
                            <div className="dashboard-info-label">Issuer</div>
                            <div className="dashboard-info-value">
                              {cert.issuer}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="dashboard-remove-cert-btn"
                          onClick={() => handleRemoveCertification(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Add new certification */}
            <div className="profile-row">
              <div className="profile-field">
                <label>
                  Certification Name <span>*</span>
                </label>
                <input
                  type="text"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                />
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>
                  Issuing Organization <span>*</span>
                </label>
                <input
                  type="text"
                  value={certOrg}
                  onChange={(e) => setCertOrg(e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                />
              </div>
            </div>

            <div className="profile-row">
              <div className="profile-field">
                <label>
                  Issue Date <span>*</span>
                </label>
                <input
                  type="text"
                  value={certIssueDate}
                  onChange={(e) => setCertIssueDate(e.target.value)}
                  placeholder="yyyy-mm-dd"
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "skills" && (
          <>
            {/* 🔽 ADDED SKILL DROPDOWN */}
            <div className="profile-row">
              <div className="profile-field">
                <label>Select a Skill</label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      addSkillDirect(e.target.value);
                    }
                  }}
                >
                  <option value="">Choose a skill from list</option>
                  {skillsList.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* EXISTING INPUT + ADD BUTTON */}
            <div className="profile-row">
              <div className="profile-field">
                <label>Add a Skill</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="e.g. React, Django, DSA"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="profile-secondary-btn"
                    onClick={handleAddSkill}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* SKILLS LIST */}
            {dashboardData.skills.length > 0 && (
              <div className="profile-row">
                <div className="profile-field">
                  <label>Your Skills</label>
                  <div className="dashboard-skills-list">
                    {dashboardData.skills.map((skill, idx) => (
                      <span
                        key={`${skill}-${idx}`}
                        className="dashboard-skill-tag"
                      >
                        {skill}
                        <button
                          type="button"
                          className="dashboard-remove-skill-btn"
                          onClick={() => handleRemoveSkill(idx)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="profile-actions">
          <button
            type="submit"
            className="profile-primary-btn"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;