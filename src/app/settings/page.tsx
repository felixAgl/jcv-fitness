"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Mail, Calendar, Shield, Check, Loader2 } from "lucide-react";
import { ProtectedRoute, useAuth } from "@/features/auth";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui";
import { JCVLogoMini } from "@/shared/components/JCVLogo";
import { buildWhatsAppUrl } from "@/features/landing/utils/whatsapp";

export default function SettingsPage() {
  const { user, profile, refreshSession } = useAuth();
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("No se pudo conectar con el servidor");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshSession();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver al panel</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <JCVLogoMini variant="cyan" size="sm" />
              <span className="text-lg font-bold">
                <span className="text-accent-cyan">JCV</span>
                <span className="text-white/80"> FITNESS</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Configuración</h1>
            <p className="text-gray-400">Administra tu perfil y cuenta</p>
          </div>

          <div className="space-y-6">
            {/* Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-accent-cyan" />
                  Información del perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Correo electrónico
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-400">{user?.email}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    El correo no se puede modificar
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Cambios guardados correctamente
                  </div>
                )}

                <Button
                  onClick={handleSave}
                  disabled={isSaving || fullName === profile?.full_name}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Cuenta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent-cyan" />
                  Información de la cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Estado</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${profile?.has_active_subscription ? "bg-green-500" : "bg-gray-500"}`} />
                      <span className="text-white">
                        {profile?.has_active_subscription ? "Suscripción activa" : "Sin suscripción"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Plan actual</span>
                    <p className="text-white mt-1">
                      {profile?.current_plan?.replace("PLAN_", "") || "Free"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Miembro desde
                    </span>
                    <p className="text-white mt-1">{formatDate(profile?.created_at)}</p>
                  </div>
                  {profile?.subscription_end_date && (
                    <div>
                      <span className="text-sm text-gray-500">Suscripción hasta</span>
                      <p className="text-white mt-1">{formatDate(profile.subscription_end_date)}</p>
                    </div>
                  )}
                </div>

                {!profile?.has_active_subscription && (
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full mt-4">
                      Ver planes de suscripción
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Zona de peligro */}
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400">Zona de peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Para eliminar tu cuenta o cancelar tu suscripción, contacta con soporte.
                </p>
                <a
                  href={buildWhatsAppUrl("Hola, necesito ayuda con mi cuenta de JCV Fitness")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Contactar soporte
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
