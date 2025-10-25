'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { fetchCourseWithProgress, fetchLesson, markLessonComplete, submitQuiz } from '@/lib/api/student';
import { LessonSidebar } from '@/components/student/lesson-sidebar';
import { VideoPlayer } from '@/components/student/video-player';
import { DocumentViewer } from '@/components/student/document-viewer';
import { Card, CardHeader, CardContent, Button, Alert } from '@/components/ui';
import type { QuizAnswer } from '@/types/student';

export default function LessonPage() {
  const t = useTranslations('student');
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const locale = params.locale as string;
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const { data: course } = useQuery({
    queryKey: ['student', 'course', courseId],
    queryFn: () => fetchCourseWithProgress(courseId, locale),
  });

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['student', 'lesson', courseId, lessonId],
    queryFn: () => fetchLesson(courseId, lessonId, locale),
  });

  const completeLessonMutation = useMutation({
    mutationFn: () => markLessonComplete(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'lesson', courseId, lessonId] });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: (answers: QuizAnswer) => submitQuiz(lesson!.quiz!.id, answers),
    onSuccess: (result) => {
      setQuizResult(result);
      queryClient.invalidateQueries({ queryKey: ['student', 'course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'lesson', courseId, lessonId] });
    },
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="error" title="Error">
          Failed to load lesson. Please try again later.
        </Alert>
      </div>
    );
  }

  if (isLoading || !lesson || !course) {
    return (
      <div className="flex h-screen">
        <div className="h-full w-80 animate-pulse bg-gray-200" />
        <div className="flex-1 animate-pulse bg-gray-100" />
      </div>
    );
  }

  const currentSection = course.sections.find((s) => s.lessons.some((l) => l.id === lessonId));
  const currentLessonIndex = currentSection?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const nextLesson = currentSection?.lessons[currentLessonIndex + 1] ||
    course.sections[course.sections.indexOf(currentSection!) + 1]?.lessons[0];
  const prevLesson = currentLessonIndex > 0
    ? currentSection?.lessons[currentLessonIndex - 1]
    : course.sections[Math.max(0, course.sections.indexOf(currentSection!) - 1)]?.lessons.slice(-1)[0];

  const handleMarkComplete = () => {
    completeLessonMutation.mutate();
  };

  const handleSubmitQuiz = () => {
    if (lesson.quiz && Object.keys(quizAnswers).length > 0) {
      submitQuizMutation.mutate(quizAnswers);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      router.push(`/${locale}/student/courses/${courseId}/lessons/${nextLesson.id}`);
    }
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      router.push(`/${locale}/student/courses/${courseId}/lessons/${prevLesson.id}`);
    }
  };

  const isCompleted = lesson.progress.status === 'COMPLETED';
  const questions = lesson.quiz?.questions as any[] || [];

  return (
    <div className="flex h-screen">
      <div className="w-80 flex-shrink-0 overflow-hidden border-r border-gray-200">
        <LessonSidebar sections={course.sections} currentLessonId={lessonId} courseId={courseId} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="mb-6">
            <div className="mb-2 text-sm text-gray-600">
              {lesson.section.title} / {t('lesson')} {lesson.position}
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900">{lesson.title}</h1>

            {lesson.summary && (
              <p className="mb-4 text-lg text-gray-600">{lesson.summary}</p>
            )}

            {isCompleted && (
              <Alert variant="success" title={t('mark_completed')}>
                You completed this lesson on {new Date(lesson.progress.completedAt!).toLocaleDateString()}
              </Alert>
            )}
          </div>

          {lesson.type === 'VIDEO' && lesson.videoUrl && (
            <div className="mb-8">
              <VideoPlayer
                url={lesson.videoUrl}
                onEnded={handleMarkComplete}
              />
            </div>
          )}

          {lesson.type === 'ARTICLE' && lesson.content && (
            <Card className="mb-8">
              <CardContent>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </CardContent>
            </Card>
          )}

          {lesson.files && lesson.files.length > 0 && (
            <Card className="mb-8">
              <CardHeader title={t('resources')} />
              <CardContent>
                <div className="space-y-4">
                  {lesson.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {t('download')}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lesson.quiz && !quizResult && (
            <Card className="mb-8">
              <CardHeader title={t('quiz')} />
              <CardContent>
                {!showQuiz ? (
                  <div className="text-center">
                    <p className="mb-4 text-gray-700">{lesson.quiz.description}</p>
                    <div className="mb-6 text-sm text-gray-600">
                      <p>Questions: {questions.length}</p>
                      <p>Passing score: {lesson.quiz.passingScore}%</p>
                      {lesson.quiz.timeLimit && <p>Time limit: {lesson.quiz.timeLimit} minutes</p>}
                    </div>
                    <Button variant="primary" onClick={() => setShowQuiz(true)}>
                      Start Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={question.id} className="rounded-lg border border-gray-200 p-4">
                        <p className="mb-3 font-medium text-gray-900">
                          {index + 1}. {question.question}
                        </p>
                        {question.type === 'multiple_choice' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option: string, optionIndex: number) => (
                              <label
                                key={optionIndex}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option}
                                  checked={quizAnswers[question.id] === option}
                                  onChange={(e) =>
                                    setQuizAnswers({ ...quizAnswers, [question.id]: e.target.value })
                                  }
                                  className="h-4 w-4 text-primary-600"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        {question.type === 'true_false' && (
                          <div className="space-y-2">
                            {['True', 'False'].map((option) => (
                              <label
                                key={option}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={option}
                                  checked={quizAnswers[question.id] === option}
                                  onChange={(e) =>
                                    setQuizAnswers({ ...quizAnswers, [question.id]: e.target.value })
                                  }
                                  className="h-4 w-4 text-primary-600"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="primary"
                      onClick={handleSubmitQuiz}
                      disabled={submitQuizMutation.isPending}
                      className="w-full"
                    >
                      {submitQuizMutation.isPending ? 'Submitting...' : t('submit_quiz')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {quizResult && (
            <Card className="mb-8">
              <CardHeader title={t('quiz_results')} />
              <CardContent>
                <div className="mb-6 text-center">
                  <div className={`mb-2 text-5xl font-bold ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {quizResult.score}%
                  </div>
                  <p className={`text-lg font-medium ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {quizResult.passed ? t('passed') : t('failed')}
                  </p>
                  <p className="mt-2 text-gray-600">
                    {quizResult.correctAnswers} / {quizResult.totalQuestions} {t('correct_answers')}
                  </p>
                </div>

                <div className="space-y-4">
                  {quizResult.results.map((result: any, index: number) => (
                    <div
                      key={result.questionId}
                      className={`rounded-lg border p-4 ${result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <p className="mb-2 font-medium text-gray-900">
                        {index + 1}. {result.question}
                      </p>
                      <p className="text-sm text-gray-700">
                        Your answer: <span className="font-medium">{result.userAnswer}</span>
                      </p>
                      {!result.isCorrect && (
                        <p className="text-sm text-gray-700">
                          Correct answer: <span className="font-medium text-green-700">{result.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {!quizResult.passed && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuizResult(null);
                      setQuizAnswers({});
                      setShowQuiz(false);
                    }}
                    className="mt-6 w-full"
                  >
                    {t('try_again')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {!isCompleted && !lesson.quiz && (
            <Button
              variant="primary"
              onClick={handleMarkComplete}
              disabled={completeLessonMutation.isPending}
              className="mb-8 w-full"
            >
              {completeLessonMutation.isPending ? 'Marking...' : t('mark_complete')}
            </Button>
          )}

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevLesson}
              disabled={!prevLesson}
              className="flex-1"
            >
              {t('previous_lesson')}
            </Button>
            <Button
              variant="primary"
              onClick={handleNextLesson}
              disabled={!nextLesson}
              className="flex-1"
            >
              {t('next_lesson')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
