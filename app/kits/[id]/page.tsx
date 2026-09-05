"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { InterviewKit, Question, Flashcard, ScheduleDay } from "@/types";
import Loading from "@/components/Loading";
import ErrorMessage from "@/components/ErrorMessage";

type BuilderState = {
  editedQuestionIds: string[];
  editedFlashcardIds: string[];
  briefEdited: boolean;
  confidence: Record<string, number>;
  covered: string[];
};

const EMPTY_BUILDER_STATE: BuilderState = {
  editedQuestionIds: [],
  editedFlashcardIds: [],
  briefEdited: false,
  confidence: {},
  covered: [],
};

function errorText(error: any, fallback: string) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    fallback
  );
}

export default function KitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [builderState, setBuilderState] =
    useState<BuilderState>(EMPTY_BUILDER_STATE);

  const [editingBrief, setEditingBrief] = useState(false);
  const [briefSummary, setBriefSummary] = useState("");
  const [briefWhatTheyDo, setBriefWhatTheyDo] = useState("");
  const [savingBrief, setSavingBrief] = useState(false);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [newQuestionPrompt, setNewQuestionPrompt] = useState("");
  const [newQuestionAnswer, setNewQuestionAnswer] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("technical");
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<
    1 | 2 | 3
  >(1);

  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(
    null
  );
  const [flashcardFront, setFlashcardFront] = useState("");
  const [flashcardBack, setFlashcardBack] = useState("");
  const [savingFlashcard, setSavingFlashcard] = useState(false);
  const [newFlashcardFront, setNewFlashcardFront] = useState("");
  const [newFlashcardBack, setNewFlashcardBack] = useState("");

  const [regeneratingSection, setRegeneratingSection] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [editingScheduleDay, setEditingScheduleDay] = useState<number | null>(
    null
  );
  const [scheduleFocus, setScheduleFocus] = useState("");
  const [scheduleMinutes, setScheduleMinutes] = useState(60);
  const [scheduleQuestionIds, setScheduleQuestionIds] = useState("");

  const [practiceStarted, setPracticeStarted] = useState(false);
  const [practiceOrder, setPracticeOrder] = useState<string[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceRevealed, setPracticeRevealed] = useState(false);

  const storageKey = `ai-interview-kit-builder-${id}`;

  function saveBuilderState(next: BuilderState) {
    setBuilderState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(next));
    }
  }

  function loadBuilderState() {
    if (typeof window === "undefined") return EMPTY_BUILDER_STATE;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return EMPTY_BUILDER_STATE;

      return {
        ...EMPTY_BUILDER_STATE,
        ...JSON.parse(stored),
      } as BuilderState;
    } catch {
      return EMPTY_BUILDER_STATE;
    }
  }

  async function loadKit() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/kits/${id}`);
      const loadedKit = response.data?.kit ?? response.data;
      setKit(loadedKit);
      setBuilderState(loadBuilderState());
    } catch (error: any) {
      setError(errorText(error, "Unable to load interview kit."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadKit();
  }, [id]);

  const categories = useMemo(() => {
    const values = kit?.questions.map((q) => q.category).filter(Boolean) ?? [];
    return Array.from(new Set(values));
  }, [kit]);

  function markQuestionEdited(questionId: string) {
    const ids = Array.from(
      new Set([...builderState.editedQuestionIds, questionId])
    );
    saveBuilderState({ ...builderState, editedQuestionIds: ids });
  }

  function unmarkQuestion(questionId: string) {
    saveBuilderState({
      ...builderState,
      editedQuestionIds: builderState.editedQuestionIds.filter(
        (item) => item !== questionId
      ),
    });
  }

  function markFlashcardEdited(cardId: string) {
    const ids = Array.from(
      new Set([...builderState.editedFlashcardIds, cardId])
    );
    saveBuilderState({ ...builderState, editedFlashcardIds: ids });
  }

  async function saveBrief() {
    if (!kit) return;

    const previous = kit.company_brief;
    const nextBrief = {
      ...previous,
      summary: briefSummary,
      what_they_do: briefWhatTheyDo,
    };

    setSavingBrief(true);
    setError("");
    setKit({ ...kit, company_brief: nextBrief });

    try {
      await api.patch(`/kits/${id}`, { company_brief: nextBrief });

      saveBuilderState({
        ...builderState,
        briefEdited: true,
      });
      setEditingBrief(false);
    } catch (error: any) {
      setKit({ ...kit, company_brief: previous });
      setError(errorText(error, "Failed to save company brief."));
    } finally {
      setSavingBrief(false);
    }
  }

  function startEditingBrief() {
    if (!kit) return;
    setBriefSummary(kit.company_brief.summary);
    setBriefWhatTheyDo(kit.company_brief.what_they_do);
    setEditingBrief(true);
  }

  function startEditingQuestion(question: Question) {
    setEditingQuestionId(question.id);
    setQuestionPrompt(question.prompt);
    setQuestionAnswer(question.answer_outline);
  }

  function cancelEditingQuestion() {
    setEditingQuestionId(null);
    setQuestionPrompt("");
    setQuestionAnswer("");
  }

  async function saveQuestion(questionId: string) {
    if (!kit) return;

    const previous = kit.questions;
    const next = previous.map((question) =>
      question.id === questionId
        ? {
            ...question,
            prompt: questionPrompt.trim(),
            answer_outline: questionAnswer.trim(),
          }
        : question
    );

    setSavingQuestion(true);
    setError("");
    setKit({ ...kit, questions: next });

    try {
      await api.patch(`/kits/${id}`, { questions: next });
      markQuestionEdited(questionId);
      cancelEditingQuestion();
    } catch (error: any) {
      setKit({ ...kit, questions: previous });
      setError(errorText(error, "Failed to save question."));
    } finally {
      setSavingQuestion(false);
    }
  }

  async function addQuestion() {
    if (!kit || !newQuestionPrompt.trim()) return;

    const question: Question = {
      id: `q-manual-${Date.now()}`,
      requirement_ids: [],
      category: newQuestionCategory || "technical",
      prompt: newQuestionPrompt.trim(),
      answer_outline: newQuestionAnswer.trim(),
      difficulty: newQuestionDifficulty,
    };

    const next = [...kit.questions, question];
    setKit({ ...kit, questions: next });
    setNewQuestionPrompt("");
    setNewQuestionAnswer("");
    setError("");

    try {
      await api.patch(`/kits/${id}`, { questions: next });
      markQuestionEdited(question.id);
    } catch (error: any) {
      setKit({ ...kit, questions: kit.questions });
      setError(errorText(error, "Failed to add question."));
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!kit) return;
    if (!window.confirm("Delete this question?")) return;

    const previous = kit.questions;
    const next = previous.filter((question) => question.id !== questionId);

    setKit({ ...kit, questions: next });
    unmarkQuestion(questionId);

    try {
      await api.patch(`/kits/${id}`, { questions: next });
    } catch (error: any) {
      setKit({ ...kit, questions: previous });
      setError(errorText(error, "Failed to delete question."));
    }
  }

  async function moveQuestion(questionId: string, direction: -1 | 1) {
    if (!kit) return;

    const index = kit.questions.findIndex((q) => q.id === questionId);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= kit.questions.length) return;

    const previous = kit.questions;
    const next = [...previous];
    [next[index], next[target]] = [next[target], next[index]];

    setKit({ ...kit, questions: next });
    markQuestionEdited(questionId);

    try {
      await api.patch(`/kits/${id}`, { questions: next });
    } catch (error: any) {
      setKit({ ...kit, questions: previous });
      setError(errorText(error, "Failed to reorder question."));
    }
  }

  async function moveQuestionCategory(
    questionId: string,
    category: string
  ) {
    if (!kit) return;

    const previous = kit.questions;
    const next = previous.map((question) =>
      question.id === questionId ? { ...question, category } : question
    );

    setKit({ ...kit, questions: next });
    markQuestionEdited(questionId);

    try {
      await api.patch(`/kits/${id}`, { questions: next });
    } catch (error: any) {
      setKit({ ...kit, questions: previous });
      setError(errorText(error, "Failed to move question."));
    }
  }

  function startEditingFlashcard(card: Flashcard) {
    setEditingFlashcardId(card.id);
    setFlashcardFront(card.front);
    setFlashcardBack(card.back);
  }

  async function saveFlashcard(cardId: string) {
    if (!kit) return;

    const previous = kit.flashcards;
    const next = previous.map((card) =>
      card.id === cardId
        ? {
            ...card,
            front: flashcardFront.trim(),
            back: flashcardBack.trim(),
          }
        : card
    );

    setSavingFlashcard(true);
    setKit({ ...kit, flashcards: next });
    setError("");

    try {
      await api.patch(`/kits/${id}`, { flashcards: next });
      markFlashcardEdited(cardId);
      setEditingFlashcardId(null);
    } catch (error: any) {
      setKit({ ...kit, flashcards: previous });
      setError(errorText(error, "Failed to save flashcard."));
    } finally {
      setSavingFlashcard(false);
    }
  }

  async function addFlashcard() {
    if (!kit || !newFlashcardFront.trim()) return;

    const card: Flashcard = {
      id: `f-manual-${Date.now()}`,
      front: newFlashcardFront.trim(),
      back: newFlashcardBack.trim(),
      requirement_ids: [],
    };

    const next = [...kit.flashcards, card];
    setKit({ ...kit, flashcards: next });
    setNewFlashcardFront("");
    setNewFlashcardBack("");

    try {
      await api.patch(`/kits/${id}`, { flashcards: next });
      markFlashcardEdited(card.id);
    } catch (error: any) {
      setKit({ ...kit, flashcards: kit.flashcards });
      setError(errorText(error, "Failed to add flashcard."));
    }
  }

  async function deleteFlashcard(cardId: string) {
    if (!kit) return;
    if (!window.confirm("Delete this flashcard?")) return;

    const previous = kit.flashcards;
    const next = previous.filter((card) => card.id !== cardId);

    setKit({ ...kit, flashcards: next });
    saveBuilderState({
      ...builderState,
      editedFlashcardIds: builderState.editedFlashcardIds.filter(
        (id) => id !== cardId
      ),
    });

    try {
      await api.patch(`/kits/${id}`, { flashcards: next });
    } catch (error: any) {
      setKit({ ...kit, flashcards: previous });
      setError(errorText(error, "Failed to delete flashcard."));
    }
  }

  async function regenerateSection(
    section: "brief" | "schedule" | "category",
    category?: string
  ) {
    if (!kit) return;

    const key = section === "category" ? `category:${category}` : section;
    setRegeneratingSection(key);
    setError("");

    try {
      /*
       * The existing backend regenerate endpoint returns a complete kit.
       * We merge only the requested section into the current local kit.
       * This prevents regeneration from clobbering unrelated edits.
       */
      const response = await api.post(`/kits/${id}/regenerate`, {
        jd: kit.source.jd,
        company_url: kit.source.company_url,
        days: kit.schedule.days_available,
      });

      const regeneratedKit: InterviewKit =
        response.data?.kit ?? response.data;

      if (section === "brief") {
        setKit((current) =>
          current
            ? {
                ...current,
                company_brief: regeneratedKit.company_brief,
              }
            : current
        );
      }

      if (section === "schedule") {
        setKit((current) =>
          current
            ? {
                ...current,
                schedule: regeneratedKit.schedule,
              }
            : current
        );
      }

      if (section === "category" && category) {
        const edited = new Set(builderState.editedQuestionIds);
        const generated = regeneratedKit.questions.filter(
          (question) =>
            question.category === category && !edited.has(question.id)
        );

        const currentQuestions = kit.questions;
        const next: Question[] = [];
        let inserted = false;

        for (const question of currentQuestions) {
          if (question.category !== category) {
            next.push(question);
            continue;
          }

          if (edited.has(question.id)) {
            if (!inserted) {
              next.push(...generated);
              inserted = true;
            }
            next.push(question);
          }
        }

        if (!inserted) {
          next.push(...generated);
        }

        await api.patch(`/kits/${id}`, { questions: next });
        setKit((current) =>
          current ? { ...current, questions: next } : current
        );
      }
    } catch (error: any) {
      setError(errorText(error, "Unable to regenerate section."));
    } finally {
      setRegeneratingSection("");
    }
  }

  function startEditingSchedule(day: ScheduleDay) {
    setEditingScheduleDay(day.day);
    setScheduleFocus(day.focus);
    setScheduleMinutes(day.minutes);
    setScheduleQuestionIds(day.question_ids.join("\n"));
  }

  async function saveScheduleDay(dayNumber: number) {
    if (!kit) return;

    const questionIds = scheduleQuestionIds
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    const validIds = new Set(kit.questions.map((question) => question.id));
    const invalidIds = questionIds.filter((questionId) => !validIds.has(questionId));

    if (invalidIds.length > 0) {
      setError(`Unknown question ID(s): ${invalidIds.join(", ")}`);
      return;
    }

    const previous = kit.schedule;
    const nextDays = previous.days.map((day) =>
      day.day === dayNumber
        ? {
            ...day,
            focus: scheduleFocus.trim(),
            minutes: Math.max(1, Math.round(scheduleMinutes)),
            question_ids: questionIds,
          }
        : day
    );

    const nextSchedule = {
      ...previous,
      days: nextDays,
    };

    setKit({ ...kit, schedule: nextSchedule });
    setEditingScheduleDay(null);

    try {
      await api.patch(`/kits/${id}`, { schedule: nextSchedule });
    } catch (error: any) {
      setKit({ ...kit, schedule: previous });
      setError(errorText(error, "Failed to save schedule."));
    }
  }

  function startPractice() {
    if (!kit || kit.flashcards.length === 0) return;

    const order = [...kit.flashcards]
      .sort((a, b) => {
        const aCovered = builderState.covered.includes(a.id);
        const bCovered = builderState.covered.includes(b.id);

        if (aCovered !== bCovered) return aCovered ? 1 : -1;

        const aConfidence = builderState.confidence[a.id] ?? 0;
        const bConfidence = builderState.confidence[b.id] ?? 0;

        return aConfidence - bConfidence;
      })
      .map((card) => card.id);

    setPracticeOrder(order);
    setPracticeIndex(0);
    setPracticeRevealed(false);
    setPracticeStarted(true);
  }

  function ratePractice(confidence: number) {
    const cardId = practiceOrder[practiceIndex];
    if (!cardId) return;

    const covered = Array.from(
      new Set([...builderState.covered, cardId])
    );

    saveBuilderState({
      ...builderState,
      confidence: {
        ...builderState.confidence,
        [cardId]: confidence,
      },
      covered,
    });
  }

  function nextPracticeCard() {
    if (practiceIndex >= practiceOrder.length - 1) {
      setPracticeStarted(false);
      return;
    }

    setPracticeIndex((value) => value + 1);
    setPracticeRevealed(false);
  }

  async function deleteKit() {
    if (
      !window.confirm(
        "Are you sure you want to delete this interview kit? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await api.delete(`/kits/${id}`);
      router.push("/dashboard");
    } catch (error: any) {
      setError(errorText(error, "Unable to delete interview kit."));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gray-100">
          <Navbar />
          <Loading message="Loading interview kit..." />
        </main>
      </ProtectedRoute>
    );
  }

  if (!kit) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {error || "Interview kit not found."}
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const uncoveredCount = kit.coverage.uncovered_requirement_ids.length;
  const coveredCount = builderState.covered.filter((id) =>
    kit.flashcards.some((card) => card.id === id)
  ).length;

  const currentPracticeCard =
    kit.flashcards.find(
      (card) => card.id === practiceOrder[practiceIndex]
    ) ?? null;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-100">
        <Navbar />

        <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-8">
          {error && <ErrorMessage message={error} />}

          <header className="rounded-lg bg-white p-5 shadow md:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                  {kit.role.title}
                </h1>
                <p className="mt-2 text-gray-600">{kit.source.company}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {kit.role.seniority}
                </p>
              </div>

              <button
                type="button"
                onClick={deleteKit}
                disabled={deleting}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Kit"}
              </button>
            </div>

            {kit.createdAt && (
              <p className="mt-4 text-xs text-gray-500">
                Created {new Date(kit.createdAt).toLocaleString()}
              </p>
            )}
          </header>

          <section className="rounded-lg bg-white p-5 shadow md:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold">Company Brief</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => regenerateSection("brief")}
                  disabled={!!regeneratingSection}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {regeneratingSection === "brief"
                    ? "Regenerating..."
                    : "Regenerate"}
                </button>
                {!editingBrief && (
                  <button
                    type="button"
                    onClick={startEditingBrief}
                    className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {editingBrief ? (
              <div className="space-y-4">
                <textarea
                  aria-label="Company summary"
                  value={briefSummary}
                  onChange={(e) => setBriefSummary(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <textarea
                  aria-label="What the company does"
                  value={briefWhatTheyDo}
                  onChange={(e) => setBriefWhatTheyDo(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveBrief}
                    disabled={savingBrief}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingBrief ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBrief(false)}
                    disabled={savingBrief}
                    className="rounded-md border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-1 font-medium">Summary</h3>
                  <p className="whitespace-pre-wrap text-gray-600">
                    {kit.company_brief.summary}
                  </p>
                </div>
                <div>
                  <h3 className="mb-1 font-medium">What they do</h3>
                  <p className="whitespace-pre-wrap text-gray-600">
                    {kit.company_brief.what_they_do}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg bg-white p-5 shadow md:p-6">
            <h2 className="text-xl font-bold">Requirements</h2>

            <div className="mt-5 space-y-3">
              {kit.role.requirements.map((requirement) => (
                <div key={requirement.id} className="rounded-md border p-4">
                  <div className="flex flex-col justify-between gap-2 md:flex-row">
                    <p className="font-medium">{requirement.text}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {requirement.kind}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {requirement.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow md:p-6">
            <h2 className="text-xl font-bold">Coverage</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Requirements</p>
                <p className="mt-1 text-2xl font-bold">
                  {kit.role.requirements.length}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Uncovered</p>
                <p className="mt-1 text-2xl font-bold">{uncoveredCount}</p>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Flashcards Covered</p>
                <p className="mt-1 text-2xl font-bold">
                  {coveredCount}/{kit.flashcards.length}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Interview Questions</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Edit, reorder, move, add or delete questions. Edited and
                  manually added questions are protected during category
                  regeneration.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border bg-gray-50 p-4">
              <h3 className="font-semibold">Add Question</h3>
              <div className="mt-3 grid gap-3">
                <textarea
                  aria-label="New question"
                  placeholder="Question"
                  value={newQuestionPrompt}
                  onChange={(e) => setNewQuestionPrompt(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                />
                <textarea
                  aria-label="New question answer outline"
                  placeholder="Answer outline"
                  value={newQuestionAnswer}
                  onChange={(e) => setNewQuestionAnswer(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={newQuestionCategory}
                    onChange={(e) => setNewQuestionCategory(e.target.value)}
                    className="rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    {Array.from(
                      new Set(["technical", ...categories])
                    ).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <select
                    value={newQuestionDifficulty}
                    onChange={(e) =>
                      setNewQuestionDifficulty(
                        Number(e.target.value) as 1 | 2 | 3
                      )
                    }
                    className="rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    <option value={1}>Difficulty 1</option>
                    <option value={2}>Difficulty 2</option>
                    <option value={3}>Difficulty 3</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={!newQuestionPrompt.trim()}
                  className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Add Question
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {kit.questions.length === 0 && (
                <p className="text-gray-500">No questions available.</p>
              )}

              {kit.questions.map((question, index) => (
                <article key={question.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-blue-600">
                        #{index + 1}
                      </span>

                      <select
                        aria-label={`Category for question ${index + 1}`}
                        value={question.category}
                        onChange={(e) =>
                          moveQuestionCategory(question.id, e.target.value)
                        }
                        className="rounded border px-2 py-1 text-sm"
                      >
                        {Array.from(
                          new Set([question.category, ...categories])
                        ).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                        Difficulty {question.difficulty}
                      </span>

                      {builderState.editedQuestionIds.includes(question.id) && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          Edited / pinned
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, -1)}
                        disabled={index === 0}
                        className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                        aria-label="Move question up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(question.id, 1)}
                        disabled={index === kit.questions.length - 1}
                        className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                        aria-label="Move question down"
                      >
                        ↓
                      </button>
                      {categories.includes(question.category) && (
                        <button
                          type="button"
                          onClick={() =>
                            regenerateSection("category", question.category)
                          }
                          disabled={!!regeneratingSection}
                          className="rounded border px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          {regeneratingSection ===
                          `category:${question.category}`
                            ? "Regenerating..."
                            : "Regenerate Category"}
                        </button>
                      )}
                      {editingQuestionId !== question.id && (
                        <button
                          type="button"
                          onClick={() => startEditingQuestion(question)}
                          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteQuestion(question.id)}
                        className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingQuestionId === question.id ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        aria-label="Question"
                        value={questionPrompt}
                        onChange={(e) => setQuestionPrompt(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <textarea
                        aria-label="Answer outline"
                        value={questionAnswer}
                        onChange={(e) => setQuestionAnswer(e.target.value)}
                        rows={5}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveQuestion(question.id)}
                          disabled={savingQuestion}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                          {savingQuestion ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingQuestion}
                          disabled={savingQuestion}
                          className="rounded-md border px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <h3 className="font-medium text-gray-900">
                        {question.prompt}
                      </h3>
                      <div className="mt-3">
                        <p className="mb-1 text-sm font-medium text-gray-700">
                          Answer outline
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-gray-600">
                          {question.answer_outline}
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Flashcards</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Edit, add and delete flashcards. Practice below tracks
                  coverage and confidence locally for this kit.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border bg-gray-50 p-4">
              <h3 className="font-semibold">Add Flashcard</h3>
              <div className="mt-3 space-y-3">
                <input
                  aria-label="Flashcard front"
                  placeholder="Front / question"
                  value={newFlashcardFront}
                  onChange={(e) => setNewFlashcardFront(e.target.value)}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                />
                <textarea
                  aria-label="Flashcard back"
                  placeholder="Back / answer"
                  value={newFlashcardBack}
                  onChange={(e) => setNewFlashcardBack(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addFlashcard}
                  disabled={!newFlashcardFront.trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Add Flashcard
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {kit.flashcards.length === 0 && (
                <p className="text-gray-500">No flashcards available.</p>
              )}

              {kit.flashcards.map((card) => (
                <article key={card.id} className="rounded-xl border p-5">
                  {editingFlashcardId === card.id ? (
                    <div className="space-y-3">
                      <input
                        value={flashcardFront}
                        onChange={(e) => setFlashcardFront(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        aria-label="Flashcard front"
                      />
                      <textarea
                        value={flashcardBack}
                        onChange={(e) => setFlashcardBack(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        aria-label="Flashcard back"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveFlashcard(card.id)}
                          disabled={savingFlashcard}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                          {savingFlashcard ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFlashcardId(null)}
                          disabled={savingFlashcard}
                          className="rounded-md border px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Question
                      </p>
                      <p className="mt-2 font-medium">{card.front}</p>

                      <details className="mt-4 rounded-lg bg-gray-50 p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          Reveal answer
                        </summary>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                          {card.back}
                        </p>
                      </details>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingFlashcard(card)}
                          className="rounded border px-3 py-1.5 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFlashcard(card.id)}
                          className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600"
                        >
                          Delete
                        </button>
                        {builderState.editedFlashcardIds.includes(card.id) && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                            Edited
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Preparation Schedule</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {kit.schedule.days_available} days
                </p>
              </div>

              <button
                type="button"
                onClick={() => regenerateSection("schedule")}
                disabled={!!regeneratingSection}
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              >
                {regeneratingSection === "schedule"
                  ? "Regenerating..."
                  : "Regenerate Schedule"}
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {kit.schedule.days.map((day) => (
                <article key={day.day} className="rounded-md border p-5">
                  {editingScheduleDay === day.day ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          value={scheduleFocus}
                          onChange={(e) => setScheduleFocus(e.target.value)}
                          className="rounded-md border px-3 py-2 text-sm"
                          aria-label={`Focus for day ${day.day}`}
                        />
                        <input
                          type="number"
                          min={1}
                          value={scheduleMinutes}
                          onChange={(e) =>
                            setScheduleMinutes(Number(e.target.value))
                          }
                          className="rounded-md border px-3 py-2 text-sm"
                          aria-label={`Minutes for day ${day.day}`}
                        />
                      </div>

                      <textarea
                        value={scheduleQuestionIds}
                        onChange={(e) =>
                          setScheduleQuestionIds(e.target.value)
                        }
                        rows={4}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        aria-label={`Question IDs for day ${day.day}`}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveScheduleDay(day.day)}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingScheduleDay(null)}
                          className="rounded-md border px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">Day {day.day}</h3>
                        <span className="text-sm text-gray-500">
                          {day.minutes} minutes
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {day.focus}
                      </p>

                      <p className="mt-3 text-xs text-gray-500">
                        {day.question_ids.length} questions
                      </p>

                      <button
                        type="button"
                        onClick={() => startEditingSchedule(day)}
                        className="mt-4 rounded border px-3 py-1.5 text-sm"
                      >
                        Edit Day
                      </button>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-5 shadow md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Flashcard Practice</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Covered: {coveredCount}/{kit.flashcards.length}. Next
                  sessions prioritize uncovered and lower-confidence cards.
                </p>
              </div>

              <button
                type="button"
                onClick={startPractice}
                disabled={kit.flashcards.length === 0}
                className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-50"
              >
                {practiceStarted ? "Restart Session" : "Start Practice"}
              </button>
            </div>

            {kit.flashcards.length === 0 ? (
              <p className="mt-5 text-gray-500">
                Add flashcards before starting practice.
              </p>
            ) : practiceStarted && currentPracticeCard ? (
              <div className="mt-6 rounded-xl border p-6">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Card {practiceIndex + 1} of {practiceOrder.length}
                  </span>
                  <span>
                    {builderState.covered.includes(currentPracticeCard.id)
                      ? "Covered"
                      : "Uncovered"}
                  </span>
                </div>

                <p className="mt-6 text-lg font-semibold text-gray-900">
                  {currentPracticeCard.front}
                </p>

                {practiceRevealed && (
                  <div className="mt-5 rounded-lg bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {currentPracticeCard.back}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPracticeRevealed((value) => !value)}
                    className="rounded-md border px-4 py-2 text-sm"
                  >
                    {practiceRevealed ? "Hide Answer" : "Reveal Answer"}
                  </button>
                </div>

                {practiceRevealed && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-gray-700">
                      Confidence
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((confidence) => (
                        <button
                          type="button"
                          key={confidence}
                          onClick={() => ratePractice(confidence)}
                          className={`rounded-md border px-3 py-2 text-sm ${
                            builderState.confidence[currentPracticeCard.id] ===
                            confidence
                              ? "bg-blue-600 text-white"
                              : "bg-white"
                          }`}
                        >
                          {confidence}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={nextPracticeCard}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    {practiceIndex >= practiceOrder.length - 1
                      ? "Finish Session"
                      : "Next Card"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-lg bg-gray-50 p-5 text-sm text-gray-600">
                Start practice to go through one flashcard at a time.
              </div>
            )}
          </section>
        </section>
      </main>
    </ProtectedRoute>
  );
}