/**
 * Employer Dashboard - Post jobs and view posted jobs
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
import { LogOut, Briefcase, Plus } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedJobs } from "@/hooks/use-translated-content";

export default function EmployerDashboard() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const { t } = useLanguage();
  const [jobPostingOpen, setJobPostingOpen] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<string | null>(null);
  
  const { data: myJobPostings, refetch } = api.jobPostings.getMyJobPostings.useQuery(undefined, {
    refetchInterval: 60000, // Auto-refresh every 60 seconds (1 minute)
  });
  
  // Get applicants for selected job
  const { data: applicants } = api.jobApplications.getApplicationsForJob.useQuery(
    { jobId: selectedJobForApplicants! },
    { 
      enabled: !!selectedJobForApplicants,
      refetchInterval: !!selectedJobForApplicants ? 60000 : false, // Auto-refresh applicants every 60 seconds when dialog is open
    }
  );
  
  // Translate job postings based on selected language
  const { translatedJobs, isTranslating } = useTranslatedJobs(myJobPostings);
  
  const createJobMutation = api.jobPostings.createJobPosting.useMutation({
    onSuccess: () => {
      refetch();
      setJobPostingOpen(false);
      setJobForm({
        title: "",
        description: "",
        location: "",
        payRate: "",
        requirements: "",
        startDate: "",
        endDate: "",
        workersNeeded: 1,
      });
    },
  });

  const updateJobMutation = api.jobPostings.updateJobPosting.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteJobMutation = api.jobPostings.deleteJobPosting.useMutation({
    onSuccess: () => refetch(),
  });

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    location: "",
    payRate: "",
    requirements: "",
    startDate: "",
    endDate: "",
    workersNeeded: 1,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCreateJob = () => {
    createJobMutation.mutate(jobForm);
  };

  const handleStatusChange = (id: string, status: "active" | "filled" | "closed") => {
    updateJobMutation.mutate({ id, status });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-800 mb-2">{t('employer.title')}</h1>
            <p className="text-green-600">{t('employer.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </Button>
          </div>
        </div>

        {/* Create Job Button */}
        <div className="mb-6 flex gap-3">
          <Dialog open={jobPostingOpen} onOpenChange={setJobPostingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                {t('employer.postNewJob')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-green-800">{t('employer.postNewJob')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-green-700">{t('job.title')} *</Label>
                  <Input
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="ej: Obrero de Construcción"
                    className="border-green-300"
                  />
                </div>
                <div>
                  <Label className="text-green-700">{t('job.description')} *</Label>
                  <Textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    placeholder="Describe las responsabilidades y detalles del trabajo..."
                    className="border-green-300"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-green-700">{t('job.location')}</Label>
                    <Input
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      placeholder="ej: Ciudad, Estado"
                      className="border-green-300"
                    />
                  </div>
                  <div>
                    <Label className="text-green-700">{t('job.payRate')}</Label>
                    <Input
                      value={jobForm.payRate}
                      onChange={(e) => setJobForm({ ...jobForm, payRate: e.target.value })}
                      placeholder="ej: $15/hora"
                      className="border-green-300"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-green-700">{t('job.workersNeeded')} *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={jobForm.workersNeeded}
                    onChange={(e) => setJobForm({ ...jobForm, workersNeeded: parseInt(e.target.value) || 1 })}
                    className="border-green-300"
                  />
                </div>
                <div>
                  <Label className="text-green-700">{t('job.requirements')}</Label>
                  <Textarea
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    placeholder="Lista los requisitos necesarios..."
                    className="border-green-300"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-green-700">{t('job.startDate')}</Label>
                    <Input
                      type="date"
                      value={jobForm.startDate}
                      onChange={(e) => setJobForm({ ...jobForm, startDate: e.target.value })}
                      className="border-green-300"
                    />
                  </div>
                  <div>
                    <Label className="text-green-700">{t('job.endDate')}</Label>
                    <Input
                      type="date"
                      value={jobForm.endDate}
                      onChange={(e) => setJobForm({ ...jobForm, endDate: e.target.value })}
                      className="border-green-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setJobPostingOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button 
                    onClick={handleCreateJob}
                    disabled={!jobForm.title || !jobForm.description}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {t('employer.postNewJob')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => refetch()} className="border-blue-500 text-blue-600 hover:bg-blue-50">
            🔄 Refresh
          </Button>
        </div>

        {/* Job Postings */}
        <div>
          <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            {t('employer.myJobs')}
          </h2>
          
          <div className="grid gap-4">
            {isTranslating && <p className="text-gray-500">{t('common.loading')}</p>}
            {translatedJobs?.map((job) => (
              <div
                key={job.id}
                className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-green-800">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : job.status === "filled"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {job.status === "active" ? t('job.active') : job.status === "filled" ? t('job.filled') : t('job.closed')}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{job.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                      {job.location && (
                        <div><span className="font-semibold">{t('job.location')}:</span> {job.location}</div>
                      )}
                      {job.payRate && (
                        <div><span className="font-semibold">{t('job.payRate')}:</span> {job.payRate}</div>
                      )}
                      {job.startDate && (
                        <div><span className="font-semibold">{t('job.startDate')}:</span> {new Date(job.startDate).toLocaleDateString()}</div>
                      )}
                      {job.endDate && (
                        <div><span className="font-semibold">{t('job.endDate')}:</span> {new Date(job.endDate).toLocaleDateString()}</div>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm mb-2">
                      <div>
                        <span className="font-semibold text-gray-700">{t('job.workersNeeded')}:</span>{' '}
                        <span className="text-gray-600">{job.workersNeeded || 1}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">{t('job.applications')}:</span>{' '}
                        <span className={`font-semibold ${
                          (job.applicationCount || 0) >= (job.workersNeeded || 1) 
                            ? 'text-green-600' 
                            : 'text-gray-600'
                        }`}>
                          {job.applicationCount || 0}
                        </span>
                        {(job.applicationCount || 0) > 0 && (
                          <Button
                            size="sm"
                            variant="link"
                            onClick={() => setSelectedJobForApplicants(job.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800 p-0 h-auto"
                          >
                            👥 Ver Solicitantes
                          </Button>
                        )}
                      </div>
                    </div>
                    {job.requirements && (
                      <div className="mt-3 text-sm">
                        <span className="font-semibold text-gray-700">{t('job.requirements')}:</span>
                        <p className="text-gray-600 mt-1">{job.requirements}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  {job.status === "active" && (
                    <>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(job.id, "filled")}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        {t('job.markFilled')}
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(job.id, "closed")}
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        {t('job.markClosed')}
                      </Button>
                    </>
                  )}
                  {job.status !== "active" && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(job.id, "active")}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      {t('job.reactivate')}
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteJobMutation.mutate({ id: job.id })}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            ))}
            
            {translatedJobs?.length === 0 && !isTranslating && (
              <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-green-300">
                <p className="text-green-700 mb-4">{t('employer.noJobs')}</p>
                <p className="text-sm text-gray-500">{t('employer.postFirst')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Applicants Dialog */}
        <Dialog open={!!selectedJobForApplicants} onOpenChange={(open) => !open && setSelectedJobForApplicants(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-800">👥 Solicitantes para este Trabajo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {applicants && applicants.length > 0 ? (
                applicants.map((applicant) => (
                  <div key={applicant.applicationId} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-green-800">👤 {applicant.workerName}</h4>
                        <p className="text-sm text-gray-600">@{applicant.workerUsername}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 Aplicado: {new Date(applicant.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        applicant.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : applicant.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {applicant.status === 'pending' ? 'Pendiente' : applicant.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay solicitantes todavía</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
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

  // Verify user is an employer
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userData.user.id)
    .single();

  // If account_type is explicitly worker, redirect
  if (profile && profile.account_type === "worker") {
    return {
      redirect: {
        destination: "/worker/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
