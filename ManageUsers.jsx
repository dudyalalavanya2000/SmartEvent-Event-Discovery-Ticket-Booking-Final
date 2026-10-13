import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const styles = {
  card: {
    background: "var(--surface, #ffffff)",
    border: "1px solid var(--border, #e5e7eb)",
    borderRadius: "16px",
    padding: "20px",
    minWidth: 0,
  },
  label: {
    fontSize: "13px",
    color: "var(--muted, #6b7280)",
    marginBottom: "8px",
  },
  value: {
    fontSize: "28px",
    fontWeight: 750,
    lineHeight: 1.3,
    color: "var(--text, #111827)",
  },
  button: {
    border: "1px solid var(--border, #d1d5db)",
    borderRadius: "9px",
    padding: "9px 14px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    background: "var(--surface, #ffffff)",
    color: "var(--text, #111827)",
  },
  input: {
    width: "100%",
    minWidth: 0,
    padding: "11px 13px",
    border: "1px solid var(--border, #d1d5db)",
    borderRadius: "10px",
    background: "var(--surface, #ffffff)",
    color: "var(--text, #111827)",
    fontSize: "14px",
    outlineOffset: "2px",
  },
  cell: {
    padding: "14px 16px",
    borderBottom: "1px solid var(--border, #e5e7eb)",
    textAlign: "left",
    verticalAlign: "middle",
    fontSize: "13px",
  },
  headingCell: {
    padding: "13px 16px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--muted, #6b7280)",
    background: "var(--table-header, #f9fafb)",
    borderBottom: "1px solid var(--border, #e5e7eb)",
    whiteSpace: "nowrap",
  },
};

function getRole(user) {
  return String(user.role || "USER").toUpperCase();
}

function getUserName(user) {
  return user.full_name || user.name || user.username || "Unnamed user";
}

function getInitials(user) {
  const name = getUserName(user);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function RoleBadge({ role }) {
  const colors = {
    ADMIN: { background: "#ede9fe", color: "#6d28d9" },
    ORGANIZER: { background: "#dbeafe", color: "#1d4ed8" },
    USER: { background: "#f3f4f6", color: "#4b5563" },
  };

  const color = colors[role] || colors.USER;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "11px",
        fontWeight: 750,
        letterSpacing: "0.03em",
        background: color.background,
        color: color.color,
        whiteSpace: "nowrap",
      }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderRadius: "999px",
        padding: "5px 9px",
        fontSize: "12px",
        fontWeight: 650,
        color: active ? "#15803d" : "#b91c1c",
        background: active ? "#dcfce7" : "#fee2e2",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "currentColor",
        }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingRole, setUpdatingRole] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async (showToast = false) => {
    try {
      setRefreshing(true);
      setError("");

      const response = await api.get("/admin/users");
      const data = response.data;

      const userList = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.users)
            ? data.users
            : [];

      setUsers(userList);

      if (showToast) {
        toast.success("User list refreshed.");
      }
    } catch (err) {
      const message =
        err.response?.data?.detail || "Failed to load users.";

      setError(message);

      if (showToast) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const summary = useMemo(() => {
    const total = users.length;
    const active = users.filter((user) => user.is_active).length;
    const organizers = users.filter(
      (user) => getRole(user) === "ORGANIZER"
    ).length;
    const admins = users.filter(
      (user) => getRole(user) === "ADMIN"
    ).length;

    return {
      total,
      active,
      inactive: total - active,
      organizers,
      admins,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user.id ?? "").toLowerCase().includes(query) ||
        getUserName(user).toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query) ||
        String(user.username || "").toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" || getRole(user) === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && Boolean(user.is_active)) ||
        (statusFilter === "INACTIVE" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const updateRole = async (userId, role) => {
    const user = users.find((item) => item.id === userId);

    if (!user || getRole(user) === role || updatingRole[userId]) {
      return;
    }

    const confirmed = window.confirm(
      `Change ${getUserName(user)}'s role to ${role}?`
    );

    if (!confirmed) return;

    setUpdatingRole((previous) => ({ ...previous, [userId]: true }));

    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      toast.success("User role updated successfully.");
      await fetchUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Failed to update user role."
      );
    } finally {
      setUpdatingRole((previous) => ({
        ...previous,
        [userId]: false,
      }));
    }
  };

  const toggleStatus = async (user) => {
    if (updatingStatus[user.id]) return;

    const nextStatus = !user.is_active;
    const action = nextStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${getUserName(user)}?`
    );

    if (!confirmed) return;

    setUpdatingStatus((previous) => ({
      ...previous,
      [user.id]: true,
    }));

    try {
      await api.patch(`/admin/users/${user.id}/status`, {
        is_active: nextStatus,
      });

      toast.success(
        `User ${nextStatus ? "activated" : "deactivated"} successfully.`
      );

      await fetchUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Failed to update user status."
      );
    } finally {
      setUpdatingStatus((previous) => ({
        ...previous,
        [user.id]: false,
      }));
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <div
      className="page-container"
      style={{ display: "grid", gap: "24px", paddingBottom: "40px" }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <p
            style={{
              color: "#6366f1",
              fontSize: "12px",
              fontWeight: 750,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            ADMINISTRATION
          </p>
          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              margin: 0,
            }}
          >
            Manage Users
          </h1>
          <p
            style={{
              marginTop: "8px",
              color: "var(--muted, #6b7280)",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Manage platform accounts, assign roles, and control access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          style={{
            ...styles.button,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            opacity: refreshing ? 0.65 : 1,
          }}
        >
          <span aria-hidden="true">↻</span>
          {refreshing ? "Refreshing..." : "Refresh users"}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            ...styles.card,
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#991b1b",
          }}
        >
          <p style={{ fontWeight: 700, margin: "0 0 6px" }}>
            Unable to load users
          </p>
          <p style={{ fontSize: "13px", margin: "0 0 12px" }}>{error}</p>
          <button
            type="button"
            onClick={() => fetchUsers(true)}
            style={{
              ...styles.button,
              background: "#ffffff",
              color: "#991b1b",
              borderColor: "#fecaca",
            }}
          >
            Try again
          </button>
        </div>
      )}

      <section
        aria-label="User statistics"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
          gap: "14px",
        }}
      >
        {[
          { label: "Total users", value: summary.total, icon: "👥" },
          { label: "Active accounts", value: summary.active, icon: "✓" },
          { label: "Inactive accounts", value: summary.inactive, icon: "⊘" },
          { label: "Organizers", value: summary.organizers, icon: "✦" },
          { label: "Administrators", value: summary.admins, icon: "♙" },
        ].map((item) => (
          <article key={item.label} style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
                marginBottom: "14px",
              }}
            >
              <span style={styles.label}>{item.label}</span>
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "#eef2ff",
                  color: "#4f46e5",
                  fontWeight: 800,
                }}
              >
                {item.icon}
              </span>
            </div>
            <p style={styles.value}>{item.value.toLocaleString("en-IN")}</p>
          </article>
        ))}
      </section>

      <section
        style={{
          ...styles.card,
          display: "grid",
          gap: "18px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 750,
            }}
          >
            Platform accounts
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              color: "var(--muted, #6b7280)",
            }}
          >
            Search accounts and manage their permissions.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "12px",
          }}
        >
          <input
            type="search"
            aria-label="Search users"
            placeholder="Search name, email, or ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={styles.input}
          />

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            style={styles.input}
          >
            <option value="ALL">All roles</option>
            <option value="USER">User</option>
            <option value="ORGANIZER">Organizer</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={styles.input}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            style={styles.button}
          >
            Reset filters
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: "13px",
            color: "var(--muted, #6b7280)",
          }}
        >
          <span>
            Showing{" "}
            <strong style={{ color: "var(--text, #111827)" }}>
              {filteredUsers.length}
            </strong>{" "}
            of {users.length} users
          </span>
          <span>Role and status changes apply to the selected account.</span>
        </div>

        {loading ? (
          <div
            role="status"
            style={{
              padding: "42px 16px",
              textAlign: "center",
              color: "var(--muted, #6b7280)",
            }}
          >
            <p style={{ fontSize: "24px", margin: "0 0 10px" }}>◌</p>
            <p style={{ margin: 0 }}>Loading platform users...</p>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: "12px",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "850px",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {["User", "Email", "Role", "Status", "Actions"].map(
                    (heading) => (
                      <th key={heading} style={styles.headingCell}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const role = getRole(user);
                  const active = Boolean(user.is_active);
                  const roleBusy = Boolean(updatingRole[user.id]);
                  const statusBusy = Boolean(updatingStatus[user.id]);

                  return (
                    <tr key={user.id}>
                      <td style={styles.cell}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "11px",
                          }}
                        >
                          <div
                            aria-hidden="true"
                            style={{
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                              width: "38px",
                              height: "38px",
                              borderRadius: "12px",
                              background: "#eef2ff",
                              color: "#4338ca",
                              fontSize: "12px",
                              fontWeight: 800,
                            }}
                          >
                            {getInitials(user) || "U"}
                          </div>
                          <div>
                            <p
                              style={{
                                fontWeight: 700,
                                margin: 0,
                                color: "var(--text, #111827)",
                              }}
                            >
                              {getUserName(user)}
                            </p>
                            <p
                              style={{
                                margin: "4px 0 0",
                                color: "var(--muted, #6b7280)",
                                fontSize: "11px",
                              }}
                            >
                              ID: {user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td
                        style={{
                          ...styles.cell,
                          color: "var(--muted, #6b7280)",
                        }}
                      >
                        {user.email || "—"}
                      </td>

                      <td style={styles.cell}>
                        <div
                          style={{
                            display: "grid",
                            justifyItems: "start",
                            gap: "8px",
                          }}
                        >
                          <RoleBadge role={role} />
                          <select
                            aria-label={`Change role for ${getUserName(user)}`}
                            value={role}
                            disabled={roleBusy || statusBusy}
                            onChange={(event) =>
                              updateRole(user.id, event.target.value)
                            }
                            style={{
                              ...styles.input,
                              width: "140px",
                              padding: "7px 9px",
                              fontSize: "12px",
                              opacity: roleBusy ? 0.65 : 1,
                            }}
                          >
                            <option value="USER">USER</option>
                            <option value="ORGANIZER">ORGANIZER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          {roleBusy && (
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--muted, #6b7280)",
                              }}
                            >
                              Updating role...
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={styles.cell}>
                        <StatusBadge active={active} />
                      </td>

                      <td style={styles.cell}>
                        <button
                          type="button"
                          disabled={statusBusy || roleBusy}
                          onClick={() => toggleStatus(user)}
                          style={{
                            ...styles.button,
                            color: active ? "#b91c1c" : "#15803d",
                            borderColor: active ? "#fecaca" : "#bbf7d0",
                            background: active ? "#fff7f7" : "#f0fdf4",
                            opacity: statusBusy ? 0.65 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusBusy
                            ? "Updating..."
                            : active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "42px 16px",
                        textAlign: "center",
                        borderBottom: "none",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "24px",
                          margin: "0 0 10px",
                        }}
                      >
                        👥
                      </p>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontWeight: 700,
                          color: "var(--text, #111827)",
                        }}
                      >
                        No users found
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "var(--muted, #6b7280)",
                        }}
                      >
                        Try another search or reset your filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
