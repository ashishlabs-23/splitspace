"use client";
import { Space, Member } from "@/lib/api";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function MemberList({
  space,
  onAddPerson,
}: {
  space: Space;
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
        {space.members.map((m) => (
          <div className="person-line" key={m.id}>
            <Avatar m={m} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{m.name}</strong>
              <small style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{m.email}</small>
            </div>
            <span className={`role-badge ${m.role}`}>{m.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
