"use client";

import React from "react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type GroupTemplateFormProps = {
  groupId: string;
  initialObjectives: string[];
  initialFreeSpaceOrdinal: number;
  currentVersion: number;
};

export function GroupTemplateForm({
  groupId,
  initialObjectives,
  initialFreeSpaceOrdinal,
  currentVersion
}: GroupTemplateFormProps) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<string[]>(initialObjectives);
  const [freeSpaceOrdinal, setFreeSpaceOrdinal] = useState<number>(initialFreeSpaceOrdinal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedVersion, setSavedVersion] = useState<number | null>(null);

  const objectiveCount = useMemo(() => objectives.length, [objectives]);

  function updateObjective(index: number, value: string) {
    setObjectives((previous) => previous.map((item, i) => (i === index ? value : item)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavedVersion(null);
    setIsSubmitting(true);

    const payload = {
      objectives: objectives.map((objective) => objective.trim()),
      freeSpaceOrdinal
    };

    const response = await fetch(`/api/groups/${groupId}/template`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as { error?: string; version?: number };

    if (!response.ok) {
      setError(data.error ?? "Unable to save board template.");
      setIsSubmitting(false);
      return;
    }

    setSavedVersion(data.version ?? null);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <section>
      <h2>Board template</h2>
      <p>Current version: {currentVersion}</p>
      <p>Provide exactly 25 objectives and choose one free-space tile.</p>

      <form onSubmit={handleSubmit}>
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
              <label>
                <input
                  type="radio"
                  name="free-space"
                  checked={freeSpaceOrdinal === index}
                  onChange={() => setFreeSpaceOrdinal(index)}
                />
                Free space
              </label>
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
      {savedVersion ? <p>Template saved as version {savedVersion}.</p> : null}
    </section>
  );
}
