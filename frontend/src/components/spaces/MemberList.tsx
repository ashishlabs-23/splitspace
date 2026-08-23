"use client";
import { Space, Member } from "@/lib/api";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function MemberList({
  space,
  currentUser,
  onAddPerson,
}: {
  space: Space;
  currentUser?: Member | null;
  onAddPerson: () => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>People</h2>
          <p>Everyone in this space.</p>
        </div>
        <button
          className="icon-btn sm"
          onClick={onAddPerson}
          aria-label="Add person"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="people-list">
        {space.members.map((m) => {
          let displayName = m.name;
          if (
            currentUser?.email &&
            m.email?.toLowerCase() === currentUser.email.toLowerCase() &&
            currentUser.name
          ) {
            displayName = currentUser.name;
          }
          return (
            <div className="person-line" key={m.id}>
              <Avatar m={{ ...m, name: displayName }} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{displayName}</strong>
                <small style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{m.email}</small>
              </div>
              <span className={`role-badge ${m.role}`}>{m.role}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
