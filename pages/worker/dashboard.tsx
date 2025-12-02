/**
 * Worker Dashboard - View job postings and manage job history
 */

import { api } from "@/utils/trpc/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useRouter } from "next/router";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedJobs } from "@/hooks/use-translated-content";

// Job Application Button Component
function JobApplicationButton({ jobId, disabled }: { jobId: string; disabled: boolean }) {
  const { t } = useLanguage();
  const apiUtils = api.useUtils();
  
  const { data: hasApplied, isLoading: checkingApplication } = 
    api.jobApplications.hasApplied.useQuery({ jobId });

  const applyMutation = api.jobApplications.applyToJob.useMutation({
    onSuccess: () => {
      console.log('Application successful!');
      apiUtils.jobApplications.hasApplied.invalidate({ jobId });
      apiUtils.jobPostings.getAllJobPostings.invalidate();
    },
    onError: (error) => {
      console.error('Application error:', error);
      alert(`Error applying: ${error.message}`);
    },
  });

  const withdrawMutation = api.jobApplications.withdrawApplication.useMutation({
    onSuccess: () => {
      console.log('Withdraw successful!');
      apiUtils.jobApplications.hasApplied.invalidate({ jobId });
      apiUtils.jobPostings.getAllJobPostings.invalidate();
    },
    onError: (error) => {
      console.error('Withdraw error:', error);
      alert(`Error withdrawing: ${error.message}`);
    },
  });

  if (checkingApplication) {
    return <Button disabled size="sm" className="w-full">{t('common.loading')}</Button>;
  }

  if (hasApplied) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => withdrawMutation.mutate({ jobId })}
        disabled={withdrawMutation.isPending}
        className="w-full bg-white border-yellow-500 text-yellow-700 hover:bg-yellow-50"
      >
        {withdrawMutation.isPending ? t('common.loading') : `❌ ${t('job.withdraw')}`}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => applyMutation.mutate({ jobId })}
      disabled={disabled || applyMutation.isPending}
      className="w-full bg-green-600 hover:bg-green-700"
    >
      {applyMutation.isPending ? t('common.loading') : `✅ ${t('job.applyNow')}`}
    </Button>
  );
}

export default function WorkerDashboard() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const { t } = useLanguage();
  const [jobHistoryOpen, setJobHistoryOpen] = useState(false);
  
  const { data: jobPostings, isLoading: postingsLoading } = api.jobPostings.getAllJobPostings.useQuery();
  const { data: myJobHistory, refetch: refetchHistory } = api.workerJobs.getMyJobHistory.useQuery();
  
  // Translate job postings based on selected language
  const { translatedJobs, isTranslating } = useTranslatedJobs(jobPostings);
  
  const addJobHistoryMutation = api.workerJobs.addJobHistory.useMutation({
    onSuccess: () => {
      refetchHistory();
      setJobHistoryOpen(false);
      setJobHistoryForm({
        employer: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    },
  });

  const deleteJobHistoryMutation = api.workerJobs.deleteJobHistory.useMutation({
    onSuccess: () => refetchHistory(),
  });

  const [jobHistoryForm, setJobHistoryForm] = useState({
    employer: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAddJobHistory = () => {
    addJobHistoryMutation.mutate(jobHistoryForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-800 mb-2">{t('worker.title')}</h1>
            <p className="text-green-600">{t('worker.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              🚪 {t('auth.logout')}
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Jobs */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
                💼 {t('worker.availableJobs')}
              </h2>
            </div>
            
            <div className="space-y-4">
              {(postingsLoading || isTranslating) && <p className="text-gray-500">{t('worker.loading')}</p>}
              
              {translatedJobs?.filter(p => p.status === "active").map((job) => {
                const spotsLeft = (job.workersNeeded || 1) - (job.applicationCount || 0);
                const isFull = spotsLeft <= 0;
                
                return (
                <div
                  key={job.id}
                  className="bg-white border-2 border-green-200 rounded-lg p-6 hover:border-green-400 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-green-800">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isFull ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800"
                    }`}>
                      {isFull ? t('job.spotsFilled') : `${spotsLeft} ${t('job.spotsAvailable')}`}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{job.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    {job.location && (
                      <div><span className="font-semibold">{t('job.location')}:</span> {job.location}</div>
                    )}
                    {job.payRate && (
                      <div><span className="font-semibold">{t('job.payRate')}:</span> {job.payRate}</div>
                    )}
                    {job.startDate && (
                      <div><span className="font-semibold">{t('job.startDate')}:</span> {new Date(job.startDate).toLocaleDateString()}</div>
                    )}
                    <div><span className="font-semibold">{t('job.workersNeeded')}:</span> {job.workersNeeded || 1}</div>
                  </div>
                  {job.requirements && (
                    <div className="mt-3 text-sm mb-3">
                      <span className="font-semibold text-gray-700">{t('job.requirements')}:</span>
                      <p className="text-gray-600 mt-1">{job.requirements}</p>
                    </div>
                  )}
                  <JobApplicationButton jobId={job.id} disabled={isFull} />
                </div>
                );
              })}
              
              {translatedJobs?.filter(p => p.status === "active").length === 0 && !postingsLoading && !isTranslating && (
                <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-green-300">
                  <p className="text-green-700">{t('worker.noJobs')}</p>
                </div>
              )}
            </div>
          </div>

          {/* My Job History */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
                📋 {t('worker.myExperience')}
              </h2>
              <Dialog open={jobHistoryOpen} onOpenChange={setJobHistoryOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    ➕ {t('worker.addExperience')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-green-800">{t('worker.addExperience')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-green-700">🏢 {t('job.employer')} *</Label>
                      <Input
                        value={jobHistoryForm.employer}
                        onChange={(e) => setJobHistoryForm({ ...jobHistoryForm, employer: e.target.value })}
                        className="border-green-300 bg-white text-black"
                        style={{ color: '#000000', caretColor: '#000000' }}
                      />
                    </div>
                    <div>
                      <Label className="text-green-700">👷 {t('job.position')} *</Label>
                      <Input
                        value={jobHistoryForm.position}
                        onChange={(e) => setJobHistoryForm({ ...jobHistoryForm, position: e.target.value })}
                        className="border-green-300 bg-white text-black"
                        style={{ color: '#000000', caretColor: '#000000' }}
                      />
                    </div>
                    <div>
                      <Label className="text-green-700">📍 {t('job.location')}</Label>
                      <Input
                        value={jobHistoryForm.location}
                        onChange={(e) => setJobHistoryForm({ ...jobHistoryForm, location: e.target.value })}
                        className="border-green-300 bg-white text-black"
                        style={{ color: '#000000', caretColor: '#000000' }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-green-700">📅 {t('job.startDate')} *</Label>
                        <Input
                          type="date"
                          value={jobHistoryForm.startDate}
                          onChange={(e) => setJobHistoryForm({ ...jobHistoryForm, startDate: e.target.value })}
                          className="border-green-300 bg-white !text-black [&::-webkit-calendar-picker-indicator]:invert"
                          style={{ color: '#000000', caretColor: '#000000', colorScheme: 'light' }}
                        />
                      </div>
                      <div>
                        <Label className="text-green-700">📅 {t('job.endDate')}</Label>
                        <Input
                          type="date"
                          value={jobHistoryForm.endDate}
                          onChange={(e) => setJobHistoryForm({ ...jobHistoryForm, endDate: e.target.value })}
                          className="border-green-300 bg-white !text-black [&::-webkit-calendar-picker-indicator]:invert"
                          style={{ color: '#000000', caretColor: '#000000', colorScheme: 'light' }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-green-700">📝 {t('job.description')}</Label>
                      <Textarea
                        value={jobHistoryForm.description}
                        onChange={(e) => setJobHistoryForm({ ...jobHistoryForm, description: e.target.value })}
                        className="border-green-300 bg-white text-black"
                        style={{ color: '#000000', caretColor: '#000000' }}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setJobHistoryOpen(false)} className="border-red-600 !text-red-600 hover:bg-red-50 bg-white">
                        ❌ {t('common.cancel')}
                      </Button>
                      <Button 
                        onClick={handleAddJobHistory}
                        disabled={!jobHistoryForm.employer || !jobHistoryForm.position || !jobHistoryForm.startDate}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ {t('common.add')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {myJobHistory?.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border-2 border-green-200 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">{job.position}</h3>
                      <p className="text-gray-700 font-medium">{job.employer}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteJobHistoryMutation.mutate({ id: job.id })}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      🗑️ {t('common.delete')}
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {job.location && <p>📍 {job.location}</p>}
                    <p>📅 {new Date(job.startDate).toLocaleDateString()} - {job.endDate ? new Date(job.endDate).toLocaleDateString() : t('common.present')}</p>
                    {job.description && <p className="mt-2 text-gray-700">{job.description}</p>}
                  </div>
                </div>
              ))}
              
              {myJobHistory?.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-green-300">
                  <p className="text-green-700 mb-4">{t('worker.noExperience')}</p>
                  <p className="text-sm text-gray-500">{t('worker.addFirst')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Verify user is a worker
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userData.user.id)
    .single();

  // If account_type is explicitly employer, redirect
  if (profile && profile.account_type === "employer") {
    return {
      redirect: {
        destination: "/employer/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
