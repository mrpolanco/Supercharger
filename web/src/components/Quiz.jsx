import React, { useMemo, useState } from "react";

// Tiny YAML-ish parser is risky; quiz blocks are JSON-compatible YAML written by
// the generator, so parse with a constrained approach: the spec requires quiz
// blocks to be valid JSON.
export default function Quiz({ yamlText, quizKey, progress, updateProgress }) {
  const quiz = useMemo(() => {
    try {
      return JSON.parse(yamlText);
    } catch {
      return null;
    }
  }, [yamlText]);

  const saved = progress.quizzes[quizKey] || {};
  const [answers, setAnswers] = useState(saved.answers || {});
  const [submitted, setSubmitted] = useState(!!saved.submitted);

  if (!quiz?.questions) return <div className="error">Invalid quiz block.</div>;

  const submit = () => {
    setSubmitted(true);
    updateProgress((p) => {
      p.quizzes[quizKey] = { answers, submitted: true };
      return p;
    });
  };

  const score = quiz.questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="quiz">
      <div className="quiz-title">📝 Check your understanding</div>
      {quiz.questions.map((q, i) => (
        <div key={i} className="quiz-q">
          <p><strong>{q.q}</strong></p>
          {q.options.map((opt, oi) => {
            const chosen = answers[i] === oi;
            let cls = "quiz-opt";
            if (submitted && oi === q.answer) cls += " correct";
            else if (submitted && chosen) cls += " wrong";
            else if (chosen) cls += " chosen";
            return (
              <label key={oi} className={cls}>
                <input
                  type="radio"
                  name={`${quizKey}-${i}`}
                  checked={chosen}
                  disabled={submitted}
                  onChange={() => setAnswers({ ...answers, [i]: oi })}
                />
                {opt}
              </label>
            );
          })}
          {submitted && q.explain && <div className="explain">{q.explain}</div>}
        </div>
      ))}
      {!submitted ? (
        <button
          className="btn primary"
          disabled={Object.keys(answers).length < quiz.questions.length}
          onClick={submit}
        >
          Submit answers
        </button>
      ) : (
        <div className="quiz-score">
          Score: {score}/{quiz.questions.length}{" "}
          <button
            className="btn small"
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
              updateProgress((p) => {
                delete p.quizzes[quizKey];
                return p;
              });
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
