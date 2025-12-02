/**
 * Worker Management Page - Lists all workers and allows creating new ones
 */

import { api } from "@/utils/trpc/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { GetServerSidePropsContext } from "next";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useRouter } from "next/router";
import { LogOut } from "lucide-react";

export default function WorkersPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const [open, setOpen] = useState(false);
  const { data: workers, refetch } = api.workers.getAllWorkers.useQuery();
  const createWorkerMutation = api.workers.createWorker.useMutation({
    onSuccess: () => {
      refetch();
      setOpen(false);
    },
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    birthdate: "",
    phoneNumber: "",
    email: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-800 mb-2">Gestión de Trabajadores</h1>
            <p className="text-green-600">Sistema de Administración de Personal</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <span className="mr-2">+</span> Agregar Trabajador
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-green-800">Crear Nuevo Trabajador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-green-700">Nombre *</Label>
                  <Input
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-green-700">Apellido *</Label>
                  <Input
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role" className="text-green-700">Puesto</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="ej: Obrero, Empleado"
                  className="border-green-300 focus:border-green-500"
                />
              </div>

              <div>
                <Label htmlFor="birthdate" className="text-green-700">Fecha de Nacimiento</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthdate: e.target.value })
                  }
                  className="border-green-300 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber" className="text-green-700">Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-green-700">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-green-700">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="border-green-300 focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact" className="text-green-700">Contacto de Emergencia</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: e.target.value,
                      })
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone" className="text-green-700">Teléfono de Emergencia</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyPhone: e.target.value,
                      })
                    }
                    className="border-green-300 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createWorkerMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createWorkerMutation.isPending ? "Creando..." : "Crear Trabajador"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>

      <div className="grid gap-4">
        {workers?.map((worker: { id: string; firstName: string; lastName: string; role: string | null; email: string | null; phoneNumber: string | null }) => (
          <Link
            key={worker.id}
            href={`/workers/${worker.id}`}
            className="block p-6 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-lg transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-green-800">
                  {worker.firstName} {worker.lastName}
                </h3>
                {worker.role && (
                  <p className="text-sm text-green-600 font-medium mt-1">{worker.role}</p>
                )}
              </div>
              <div className="text-sm text-gray-600 text-right">
                {worker.email && <p>{worker.email}</p>}
                {worker.phoneNumber && <p>{worker.phoneNumber}</p>}
              </div>
            </div>
          </Link>
        ))}
        {workers?.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-green-300">
            <p className="text-green-700 mb-4">No hay trabajadores registrados</p>
            <p className="text-sm text-gray-500">¡Crea uno para comenzar!</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

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
