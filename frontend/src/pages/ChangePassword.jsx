import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { KeyRound, Loader2 } from "lucide-react";
import { changePassword } from "@/lib/services";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const pwd = watch("newPassword");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (v) => changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      toast.success("Password updated. Please sign in again.");
      reset();
      setTimeout(() => { logout(); navigate("/login"); }, 900);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Update failed"),
  });

  return (
    <>
      <PageHeader title="Change password" description="Choose a strong password. You'll be signed out after the change." />
      <Card className="max-w-lg p-6">
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div>
            <Label>Current password</Label>
            <Input type="password" data-testid="cp-current" {...register("currentPassword", { required: "Required" })} />
            {errors.currentPassword && <p className="text-xs text-destructive mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <Label>New password</Label>
            <Input type="password" data-testid="cp-new"
              {...register("newPassword", { required: "Required", minLength: { value: 6, message: "Min 6 chars" } })} />
            {errors.newPassword && <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" data-testid="cp-confirm"
              {...register("confirm", { required: "Required", validate: (v) => v === pwd || "Passwords do not match" })} />
            {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm.message}</p>}
          </div>
          <Button type="submit" disabled={mutation.isPending} data-testid="cp-submit">
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
            Update password
          </Button>
        </form>
      </Card>
    </>
  );
}
