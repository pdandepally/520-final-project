/**
 * Worker Detail Page - Shows full worker profile with work history, skills, and documents
 */

import { api } from "@/utils/trpc/api";
import { useRouter } from "next/router";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";

export default function WorkerDetailPage() {
  const router = useRouter();
  const { workerId } = router.query as { workerId: string };

  const { data: worker, refetch, isLoading } = api.workers.getWorker.useQuery(
    { workerId },
    { enabled: !!workerId && typeof workerId === 'string' }
  );

  const deleteWorkerMutation = api.workers.deleteWorker.useMutation({
    onSuccess: () => {
      router.push("/workers");
    },
  });

  // Work History State
  const [workHistoryOpen, setWorkHistoryOpen] = useState(false);
  const [workHistoryForm, setWorkHistoryForm] = useState({
    employer: "",
    position: "",
    startDate: "",
    endDate: "",
    responsibilities: "",
  });

  const addWorkHistoryMutation = api.workers.addWorkHistory.useMutation({
    onSuccess: () => {
      refetch();
      setWorkHistoryOpen(false);
      setWorkHistoryForm({
        employer: "",
        position: "",
        startDate: "",
        endDate: "",
        responsibilities: "",
      });
    },
  });

  const deleteWorkHistoryMutation = api.workers.deleteWorkHistory.useMutation({
    onSuccess: () => refetch(),
  });

  // Skills State
  const [skillOpen, setSkillOpen] = useState(false);
  const [skillForm, setSkillForm] = useState({
    skillName: "",
    proficiencyLevel: "",
    yearsOfExperience: "",
  });

  const addSkillMutation = api.workers.addSkill.useMutation({
    onSuccess: () => {
      refetch();
      setSkillOpen(false);
      setSkillForm({
        skillName: "",
        proficiencyLevel: "",
        yearsOfExperience: "",
      });
    },
  });

  const deleteSkillMutation = api.workers.deleteSkill.useMutation({
    onSuccess: () => refetch(),
  });

  // Documents State
  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    documentType: "",
    documentName: "",
    documentUrl: "",
  });

  const addDocumentMutation = api.workers.addDocument.useMutation({
    onSuccess: () => {
      refetch();
      setDocumentOpen(false);
      setDocumentForm({
        documentType: "",
        documentName: "",
        documentUrl: "",
      });
    },
  });

  const deleteDocumentMutation = api.workers.deleteDocument.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading || !worker) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/workers" className="text-sm text-blue-600 mb-2 block">
            ← Back to Workers
          </Link>
          <h1 className="text-3xl font-bold">
            {worker.firstName} {worker.lastName}
          </h1>
          {worker.role && (
            <p className="text-lg text-muted-foreground">{worker.role}</p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Worker</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {worker.firstName}{" "}
                {worker.lastName} and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteWorkerMutation.mutate({ workerId })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Personal Information */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">
              {worker.firstName} {worker.lastName}
            </p>
          </div>
          {worker.birthdate && (
            <div>
              <p className="text-sm text-muted-foreground">Birthdate</p>
              <p className="font-medium">{worker.birthdate}</p>
            </div>
          )}
          {worker.phoneNumber && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{worker.phoneNumber}</p>
            </div>
          )}
          {worker.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{worker.email}</p>
            </div>
          )}
          {worker.address && (
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{worker.address}</p>
            </div>
          )}
          {worker.emergencyContact && (
            <div>
              <p className="text-sm text-muted-foreground">Emergency Contact</p>
              <p className="font-medium">
                {worker.emergencyContact}
                {worker.emergencyPhone && ` - ${worker.emergencyPhone}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Work History */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Work History</h2>
          <Dialog open={workHistoryOpen} onOpenChange={setWorkHistoryOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Work History</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Work History</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addWorkHistoryMutation.mutate({
                    workerId,
                    ...workHistoryForm,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="employer">Employer *</Label>
                  <Input
                    id="employer"
                    required
                    value={workHistoryForm.employer}
                    onChange={(e) =>
                      setWorkHistoryForm({
                        ...workHistoryForm,
                        employer: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    required
                    value={workHistoryForm.position}
                    onChange={(e) =>
                      setWorkHistoryForm({
                        ...workHistoryForm,
                        position: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      required
                      value={workHistoryForm.startDate}
                      onChange={(e) =>
                        setWorkHistoryForm({
                          ...workHistoryForm,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={workHistoryForm.endDate}
                      onChange={(e) =>
                        setWorkHistoryForm({
                          ...workHistoryForm,
                          endDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="responsibilities">Responsibilities</Label>
                  <Textarea
                    id="responsibilities"
                    value={workHistoryForm.responsibilities}
                    onChange={(e) =>
                      setWorkHistoryForm({
                        ...workHistoryForm,
                        responsibilities: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWorkHistoryOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          {worker.workHistory.map((history: { id: string; employer: string; position: string; startDate: string; endDate: string | null; responsibilities: string | null }) => (
            <div key={history.id} className="border-l-2 pl-4 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{history.position}</h3>
                  <p className="text-sm text-muted-foreground">
                    {history.employer}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {history.startDate} -{" "}
                    {history.endDate || "Present"}
                  </p>
                  {history.responsibilities && (
                    <p className="text-sm mt-2">{history.responsibilities}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    deleteWorkHistoryMutation.mutate({ id: history.id })
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {worker.workHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No work history added yet.
            </p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-card border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Skills</h2>
          <Dialog open={skillOpen} onOpenChange={setSkillOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Skill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Skill</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addSkillMutation.mutate({
                    workerId,
                    ...skillForm,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="skillName">Skill Name *</Label>
                  <Input
                    id="skillName"
                    required
                    value={skillForm.skillName}
                    onChange={(e) =>
                      setSkillForm({
                        ...skillForm,
                        skillName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="proficiencyLevel">Proficiency Level</Label>
                  <Input
                    id="proficiencyLevel"
                    value={skillForm.proficiencyLevel}
                    onChange={(e) =>
                      setSkillForm({
                        ...skillForm,
                        proficiencyLevel: e.target.value,
                      })
                    }
                    placeholder="e.g., Beginner, Intermediate, Expert"
                  />
                </div>
                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                  <Input
                    id="yearsOfExperience"
                    value={skillForm.yearsOfExperience}
                    onChange={(e) =>
                      setSkillForm({
                        ...skillForm,
                        yearsOfExperience: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSkillOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-wrap gap-2">
          {worker.skills.map((skill: { id: string; skillName: string; proficiencyLevel: string | null; yearsOfExperience: string | null }) => (
            <div
              key={skill.id}
              className="border rounded-lg px-3 py-2 flex items-center gap-2"
            >
              <div>
                <p className="font-medium text-sm">{skill.skillName}</p>
                {skill.proficiencyLevel && (
                  <p className="text-xs text-muted-foreground">
                    {skill.proficiencyLevel}
                    {skill.yearsOfExperience &&
                      ` • ${skill.yearsOfExperience} years`}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => deleteSkillMutation.mutate({ id: skill.id })}
              >
                ×
              </Button>
            </div>
          ))}
          {worker.skills.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No skills added yet.
            </p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          <Dialog open={documentOpen} onOpenChange={setDocumentOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Document</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Document</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addDocumentMutation.mutate({
                    workerId,
                    ...documentForm,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Input
                    id="documentType"
                    required
                    value={documentForm.documentType}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        documentType: e.target.value,
                      })
                    }
                    placeholder="e.g., ID, Resume, Certificate"
                  />
                </div>
                <div>
                  <Label htmlFor="documentName">Document Name *</Label>
                  <Input
                    id="documentName"
                    required
                    value={documentForm.documentName}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        documentName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="documentUrl">Document URL *</Label>
                  <Input
                    id="documentUrl"
                    type="url"
                    required
                    value={documentForm.documentUrl}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        documentUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDocumentOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {worker.documents.map((doc: { id: string; documentType: string; documentName: string; documentUrl: string }) => (
            <div
              key={doc.id}
              className="flex justify-between items-center p-3 border rounded"
            >
              <div>
                <p className="font-medium">{doc.documentName}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.documentType}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(doc.documentUrl, "_blank")}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDocumentMutation.mutate({ id: doc.id })}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {worker.documents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No documents added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Disable static generation and add authentication check
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
