"use client";

import React from "react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GroupTemplateFormProps = {
  groupId: string;
  initialFreeSpaceObjective: string;
  initialObjectives: string[];
  initialFreeSpaceMarkedByDefault: boolean;
  currentVersion: number;
};

export function GroupTemplateForm({
  groupId,
  initialFreeSpaceObjective,
  initialObjectives,
  initialFreeSpaceMarkedByDefault,
  currentVersion
}: GroupTemplateFormProps) {
  const router = useRouter();
  const [freeSpaceObjective, setFreeSpaceObjective] = useState<string>(initialFreeSpaceObjective);
  const [objectives, setObjectives] = useState<string[]>(initialObjectives);
  const [freeSpaceMarkedByDefault, setFreeSpaceMarkedByDefault] = useState<boolean>(
    initialFreeSpaceMarkedByDefault
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const objectiveCount = useMemo(() => objectives.length + 1, [objectives]);

  function updateObjective(index: number, value: string) {
    setObjectives((previous) => previous.map((item, i) => (i === index ? value : item)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaved(false);
    setIsSubmitting(true);

    const payload = {
      freeSpaceObjective: freeSpaceObjective.trim(),
      objectives: objectives.map((objective) => objective.trim()),
      freeSpaceMarkedByDefault
    };

    const response = await fetch(`/api/groups/${groupId}/template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to save board template.");
      setIsSubmitting(false);
      return;
    }

    setIsSaved(true);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <section>
      <h2>Board template</h2>
      <p>Current version: {currentVersion}</p>
      <p>Provide exactly 25 objectives. Free space is always rendered in the center tile.</p>

      <form onSubmit={handleSubmit}>
        <p>
          <label htmlFor="free-space-objective">Free-space objective (center tile)</label>
          <br />
          <input
            id="free-space-objective"
            type="text"
            value={freeSpaceObjective}
            onChange={(event) => setFreeSpaceObjective(event.target.value)}
            maxLength={140}
            required
          />
        </p>

        <p>
          <label>
            <input
              type="checkbox"
              checked={freeSpaceMarkedByDefault}
              onChange={(event) => setFreeSpaceMarkedByDefault(event.target.checked)}
            />
            Mark free-space as completed by default for new player boards
          </label>
        </p>

        <h3>Other objectives</h3>
        <ol>
          {objectives.map((objective, index) => (
            <li key={index}>
              <label htmlFor={`objective-${index}`}>Objective {index + 1}</label>
              <br />
              <input
                id={`objective-${index}`}
                type="text"
                value={objective}
                onChange={(event) => updateObjective(index, event.target.value)}
                maxLength={140}
                required
              />
            </li>
          ))}
        </ol>

        <p>Total objectives: {objectiveCount}</p>

        <p>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save template"}
          </button>
        </p>
      </form>

      {error ? <p>{error}</p> : null}
      {isSaved ? <p>Template saved.</p> : null}
    </section>
  );
}
