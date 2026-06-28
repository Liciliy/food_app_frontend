import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AudioLines, CalendarDays, FileAudio, Save, Sparkles, UserRound } from 'lucide-react';
import { Button } from '../components/common/Button';
import { InputField } from '../components/common/InputField';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useAuthStore } from '../stores/authStore';

export function ProfilePage() {
  const { t } = useTranslation(['auth', 'common']);
  const {
    user,
    isLoading,
    error,
    successMessage,
    updateProfile,
    uploadHealthContextVoice,
    clearError,
    clearSuccess,
  } = useAuthStore();

  const [healthContext, setHealthContext] = useState('');
  const [healthContextAppliedAt, setHealthContextAppliedAt] = useState('');
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const {
    isRecording,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    getAudioFile,
  } = useVoiceRecorder();

  useEffect(() => {
    setHealthContext(user?.health_context || '');
    setHealthContextAppliedAt(user?.health_context_applied_at || '');
  }, [user?.health_context, user?.health_context_applied_at]);

  useEffect(() => {
    return () => {
      clearError();
      clearSuccess();
    };
  }, [clearError, clearSuccess]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      health_context: healthContext.trim() || null,
      health_context_applied_at: healthContextAppliedAt || null,
    });
  };

  const handleVoiceUpload = async () => {
    const audioFile = getAudioFile();
    if (!audioFile) return;

    setIsUploadingVoice(true);
    try {
      await uploadHealthContextVoice(audioFile, healthContextAppliedAt || undefined);
      resetRecording();
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const structured = user?.health_context_structured;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="px-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-gray-900">{t('profile.title')}</h1>
              <p className="truncate text-sm text-gray-500">{t('profile.subtitle')}</p>
            </div>
          </div>
          <Link to="/statistics">
            <Button variant="outline" size="sm">{t('profile.viewReports')}</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:px-8">
        <section className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('profile.healthContextTitle')}</h2>
                <p className="text-sm text-gray-500">{t('profile.healthContextHelp')}</p>
              </div>
            </div>

            {(error || successMessage) && (
              <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                {error || successMessage}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSave}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="health-context">
                  {t('profile.healthContextLabel')}
                </label>
                <textarea
                  id="health-context"
                  value={healthContext}
                  onChange={(e) => setHealthContext(e.target.value)}
                  rows={6}
                  placeholder={t('profile.healthContextPlaceholder')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <InputField
                id="health-context-date"
                type="date"
                label={t('profile.healthContextAppliedAt')}
                value={healthContextAppliedAt}
                onChange={(e) => setHealthContextAppliedAt(e.target.value)}
                leftIcon={<CalendarDays className="h-4 w-4" />}
                helperText={t('profile.healthContextAppliedAtHelp')}
              />

              <div className="flex justify-end">
                <Button type="submit" isLoading={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common:save')}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                <AudioLines className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('profile.voiceTitle')}</h2>
                <p className="text-sm text-gray-500">{t('profile.voiceHelp')}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <Button onClick={() => startRecording('toggle')} disabled={isUploadingVoice || isLoading}>
                  <AudioLines className="mr-2 h-4 w-4" />
                  {t('profile.startVoiceNote')}
                </Button>
              ) : (
                <Button variant="outline" onClick={stopRecording}>
                  <FileAudio className="mr-2 h-4 w-4" />
                  {t('profile.stopVoiceNote')}
                </Button>
              )}

              <span className="text-sm text-gray-500">
                {isRecording ? t('profile.voiceRecording', { seconds: duration }) : audioBlob ? t('profile.voiceReady') : t('profile.voiceIdle')}
              </span>
            </div>

            {audioBlob && !isRecording && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={handleVoiceUpload} isLoading={isUploadingVoice || isLoading}>
                  {t('profile.submitVoiceNote')}
                </Button>
                <Button variant="outline" onClick={resetRecording}>
                  {t('profile.discardVoiceNote')}
                </Button>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('profile.structuredTitle')}</h2>
                <p className="text-sm text-gray-500">{t('profile.structuredHelp')}</p>
              </div>
            </div>

            {!structured ? (
              <p className="text-sm text-gray-500">{t('profile.structuredEmpty')}</p>
            ) : (
              <div className="space-y-4 text-sm">
                {structured.profile_summary && (
                  <div>
                    <p className="font-medium text-gray-900">{t('profile.summaryLabel')}</p>
                    <p className="mt-1 text-gray-600">{structured.profile_summary}</p>
                  </div>
                )}

                {([
                  ['life_stage', t('profile.lifeStage')],
                  ['dietary_patterns', t('profile.dietaryPatterns')],
                  ['health_focus', t('profile.healthFocus')],
                  ['avoidances', t('profile.avoidances')],
                  ['notes', t('profile.notes')],
                ] as const).map(([key, label]) => {
                  const values = structured[key] as string[] | undefined;
                  if (!values || values.length === 0) return null;
                  return (
                    <div key={key}>
                      <p className="font-medium text-gray-900">{label}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {values.map((value) => (
                          <span key={value} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}