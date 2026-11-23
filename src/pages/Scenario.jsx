
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  Lightbulb,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import LevelBadge from "@/components/ui/LevelBadge";
import { scenarios } from "@/data/scenarios";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const categoryIcons = {
  workplace: "💼",
  conflict_resolution: "🤝",
  communication: "💬",
  leadership: "👑",
  ethical_dilemmas: "⚖️",
  crisis_management: "🚨",
  daily_life: "🏠",
};

export default function Scenario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch scenario from Firestore with static fallback
  useEffect(() => {
    let isMounted = true;

    const fetchScenario = async () => {
      try {
        const ref = doc(db, "scenarios", id);
        const snap = await getDoc(ref);

        if (!isMounted) return;

        if (snap.exists()) {
          setScenario({
            id: snap.id,
            ...snap.data(),
          });
        } else {
          const localScenario = scenarios.find(
            (item) => String(item.id) === String(id)
          );

          setScenario(localScenario || null);
        }
      } catch (error) {
        console.error("Error fetching scenario:", error);

        if (isMounted) {
          setScenario(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchScenario();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Submit answer for authenticated AI evaluation
  const handleSubmit = async () => {
    if (userAnswer.trim().length < 50) {
      alert("Please write at least 50 characters.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Verify current Firebase user
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please sign in before submitting.");
      }

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Backend URL
      const apiBaseUrl = (
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
      ).replace(/\/$/, "");

      // Send authenticated request to backend
      const response = await fetch(`${apiBaseUrl}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          scenario: `${scenario.title} - ${scenario.description}`,
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          answer: userAnswer.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to evaluate your response."
        );
      }

      // Backend has already saved the response and awarded XP.
      // Navigate to the feedback page.
      navigate("/feedback", {
        state: data,
      });

    } catch (error) {
      console.error("Scenario submission failed:", error);

      alert(
        error.message || "Something went wrong. Please try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading scenario...
      </div>
    );
  }

  // Scenario not found UI
  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Scenario not found
          </h2>

          <Link
            to="/scenarios"
            className="text-blue-600 hover:underline"
          >
            Back to scenarios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* HEADER */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            to="/scenarios"
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* SCENARIO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#3A7BFF] to-[#23C4C7] px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {categoryIcons[scenario.category] || "📚"}
              </span>

              <span className="text-white capitalize">
                {String(scenario.category || "general").replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex gap-3 items-center">
              <LevelBadge level={scenario.level} />

              <div className="flex items-center gap-1 text-white text-sm">
                <Zap className="w-4 h-4" />
                +{scenario.base_xp || 30} XP
              </div>
            </div>
          </div>

          <div className="p-6">
            <h1 className="text-xl font-bold mb-4">
              {scenario.title}
            </h1>

            <p className="text-gray-700">
              {scenario.description}
            </p>

            {scenario.guidance && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-xl flex gap-2">
                <Lightbulb className="text-yellow-500 shrink-0" />

                <span>{scenario.guidance}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ANSWER SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm"
        >
          <Textarea
            value={userAnswer}
            onChange={(event) => setUserAnswer(event.target.value)}
            placeholder="Write your response (minimum 50 characters)..."
            className="min-h-[150px]"
            disabled={isSubmitting}
          />

          <div className="flex justify-between items-center mt-4">
            <span
              className={`text-sm ${
                userAnswer.trim().length < 50
                  ? "text-gray-400"
                  : "text-green-600"
              }`}
            >
              {userAnswer.trim().length} / 50 characters
            </span>

            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting || userAnswer.trim().length < 50
              }
              className="bg-[#3A7BFF] text-white px-6 py-2 rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Evaluating...
                </>
              ) : (
                <>
                  Submit
                  <Send className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
