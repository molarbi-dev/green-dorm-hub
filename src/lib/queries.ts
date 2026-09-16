// React Query hooks that wrap the server functions.
// Components import from here instead of calling server functions directly.
// Optimistic updates keep the UI snappy while the server catches up.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getStudents, getStudent, createStudent, updateStudent, deleteStudent, checkInStudent, checkOutStudent, acceptPolicy } from "./api/students.functions";
import { getRooms, createRoom, updateRoom, deleteRoom, getMeters, createMeter, updateMeter, deleteMeter } from "./api/rooms.functions";
import { getPayments, recordPayment } from "./api/payments.functions";
import { getSmsMessages, sendSmsToStudents, resolveSmsRecipients, testSms } from "./api/sms.functions";
import { getSettings, updateSettings } from "./api/settings.functions";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const QK = {
  students: ["students"] as const,
  student: (id: string) => ["students", id] as const,
  rooms: ["rooms"] as const,
  meters: ["meters"] as const,
  payments: (studentId?: string) => ["payments", studentId ?? "all"] as const,
  sms: ["sms"] as const,
  settings: ["settings"] as const,
};

// ── Students ──────────────────────────────────────────────────────────────────

export function useStudents() {
  return useQuery({
    queryKey: QK.students,
    queryFn: () => getStudents(),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: QK.student(id),
    queryFn: () => getStudent({ data: { id } }),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createStudent>[0]["data"]) =>
      createStudent({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.students });
      toast.success("Student added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateStudent>[0]["data"]) =>
      updateStudent({ data }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QK.students });
      qc.setQueryData(QK.student(updated.id), updated);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudent({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.students });
      toast.success("Student deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkInStudent({ data: { id } }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QK.students });
      qc.setQueryData(QK.student(updated.id), updated);
      toast.success("Checked in successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkOutStudent({ data: { id } }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QK.students });
      qc.setQueryData(QK.student(updated.id), updated);
      toast.success("Checked out successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAcceptPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptPolicy({ data: { id } }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QK.students });
      qc.setQueryData(QK.student(updated.id), updated);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Rooms & Meters ────────────────────────────────────────────────────────────

export function useRooms() {
  return useQuery({ queryKey: QK.rooms, queryFn: () => getRooms() });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createRoom>[0]["data"]) => createRoom({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.rooms }); toast.success("Room added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateRoom>[0]["data"]) => updateRoom({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.rooms }); toast.success("Room updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (no: string) => deleteRoom({ data: { no } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.rooms }); toast.success("Room deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMeters() {
  return useQuery({ queryKey: QK.meters, queryFn: () => getMeters() });
}

export function useCreateMeter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createMeter>[0]["data"]) => createMeter({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.meters }); toast.success("Meter added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMeter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateMeter>[0]["data"]) => updateMeter({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.meters }); toast.success("Meter updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMeter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (no: string) => deleteMeter({ data: { no } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK.meters }); toast.success("Meter deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function usePayments(studentId?: string) {
  return useQuery({
    queryKey: QK.payments(studentId),
    queryFn: () => getPayments({ data: { studentId } }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof recordPayment>[0]["data"]) =>
      recordPayment({ data }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK.payments() });
      qc.invalidateQueries({ queryKey: QK.payments(vars.student_id) });
      qc.invalidateQueries({ queryKey: QK.students });
      toast.success("Payment recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── SMS ───────────────────────────────────────────────────────────────────────

export function useSmsMessages() {
  return useQuery({ queryKey: QK.sms, queryFn: () => getSmsMessages() });
}

export function useSendSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof sendSmsToStudents>[0]["data"]) =>
      sendSmsToStudents({ data }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: QK.sms });
      toast.success(`SMS sent to ${(result as any).recipientCount ?? "?"} recipients`);
    },
    onError: (e: Error) => toast.error(`SMS failed: ${e.message}`),
  });
}

export function useResolveRecipients() {
  return useMutation({
    mutationFn: (group: string) => resolveSmsRecipients({ data: { group } }),
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useSettings() {
  return useQuery({ queryKey: QK.settings, queryFn: () => getSettings() });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateSettings>[0]["data"]) =>
      updateSettings({ data }),
    onSuccess: (updated) => {
      qc.setQueryData(QK.settings, updated);
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Electricity Logs ──────────────────────────────────────────────────────────

import { logElectricityTopup, getElectricityLogs } from "./api/electricity.functions";

export const QK_ELEC = {
  logs: (meterNo?: string) => ["electricity-logs", meterNo ?? "all"] as const,
};

export function useElectricityLogs(meterNo?: string) {
  return useQuery({
    queryKey: QK_ELEC.logs(meterNo),
    queryFn: () => getElectricityLogs({ data: { meterNo } }),
    enabled: !!meterNo,
  });
}

export function useLogElectricityTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof logElectricityTopup>[0]["data"]) =>
      logElectricityTopup({ data }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: QK_ELEC.logs(result.log.meter_no) });
      toast.success(`Logged & broadcast to ${result.broadcastedTo} meter-mates via SMS`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

import { loginAdmin, loginStudent, createFirstAdmin, checkAdminExists, registerStudent, resetStudentPassword } from "./api/auth.functions";

export function useLoginAdmin() {
  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      loginAdmin({ data }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useLoginStudent() {
  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      loginStudent({ data }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateFirstAdmin() {
  return useMutation({
    mutationFn: (data: { username: string; password: string; fullName: string; setupKey: string }) =>
      createFirstAdmin({ data }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCheckAdminExists() {
  return useQuery({
    queryKey: ["admin-exists"],
    queryFn: () => checkAdminExists(),
  });
}

// ── Room Pricing ──────────────────────────────────────────────────────────────

import { getRoomPricing, upsertRoomPricing, getHostelFeeForRoom } from "./api/pricing.functions";

export const QK_PRICING = {
  all: ["room-pricing"] as const,
  forRoom: (roomNo: string) => ["room-pricing", roomNo] as const,
};

export function useRoomPricing() {
  return useQuery({
    queryKey: QK_PRICING.all,
    queryFn: () => getRoomPricing(),
  });
}

export function useUpsertRoomPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { capacity: number; hostel_fee: number }[]) =>
      upsertRoomPricing({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_PRICING.all });
      toast.success("Room pricing updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHostelFeeForRoom(roomNo: string) {
  return useQuery({
    queryKey: QK_PRICING.forRoom(roomNo),
    queryFn: () => getHostelFeeForRoom({ data: { roomNo } }),
    enabled: !!roomNo,
  });
}

export function useRegisterStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof registerStudent>[0]["data"]) =>
      registerStudent({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.students }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useResetStudentPassword() {
  return useMutation({
    mutationFn: (data: { studentId: string; newPassword: string }) =>
      resetStudentPassword({ data }),
    onSuccess: () => toast.success("Password reset successfully"),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTestSms() {
  return useMutation({
    mutationFn: (phone: string) => testSms({ data: { phone } }),
    onSuccess: (result) => {
      if (result.success) toast.success("SMS sent successfully!");
      else toast.error(`SMS failed: ${result.error} (code: ${result.code})`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Payment Receipts ──────────────────────────────────────────────────────────

import { submitReceipt, getStudentReceipts, getAllReceipts, reviewReceipt } from "./api/receipts.functions";

export const QK_RECEIPTS = {
  student: (id: string) => ["receipts", id] as const,
  all: (status?: string) => ["receipts", "all", status ?? "all"] as const,
};

export function useStudentReceipts(studentId: string) {
  return useQuery({
    queryKey: QK_RECEIPTS.student(studentId),
    queryFn: () => getStudentReceipts({ data: { studentId } }),
    enabled: !!studentId,
  });
}

export function useAllReceipts(status?: string) {
  return useQuery({
    queryKey: QK_RECEIPTS.all(status),
    queryFn: () => getAllReceipts({ data: { status } }),
  });
}

export function useSubmitReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof submitReceipt>[0]["data"]) =>
      submitReceipt({ data }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: QK_RECEIPTS.student(r.student_id) });
      toast.success("Receipt submitted — management will review it shortly.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReviewReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof reviewReceipt>[0]["data"]) =>
      reviewReceipt({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_RECEIPTS.all() });
      toast.success("Receipt reviewed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Policies ──────────────────────────────────────────────────────────────────

import { getPolicies, getAllPoliciesAdmin, createPolicy, updatePolicy, deletePolicy } from "./api/policies.functions";

export const QK_POLICIES = {
  public: ["policies"] as const,
  admin: ["policies", "admin"] as const,
};

export function usePolicies() {
  return useQuery({ queryKey: QK_POLICIES.public, queryFn: () => getPolicies() });
}

export function useAllPoliciesAdmin() {
  return useQuery({ queryKey: QK_POLICIES.admin, queryFn: () => getAllPoliciesAdmin() });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createPolicy>[0]["data"]) => createPolicy({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK_POLICIES.public }); qc.invalidateQueries({ queryKey: QK_POLICIES.admin }); toast.success("Policy added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updatePolicy>[0]["data"]) => updatePolicy({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK_POLICIES.public }); qc.invalidateQueries({ queryKey: QK_POLICIES.admin }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePolicy({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK_POLICIES.public }); qc.invalidateQueries({ queryKey: QK_POLICIES.admin }); toast.success("Policy deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Internships ───────────────────────────────────────────────────────────────

import { getInternships, getActiveInternships, createInternship, updateInternship, deleteInternship } from "./api/internships.functions";

export const QK_INTERNSHIPS = {
  all: ["internships"] as const,
  active: ["internships", "active"] as const,
};

export function useInternships() {
  return useQuery({ queryKey: QK_INTERNSHIPS.all, queryFn: () => getInternships() });
}

export function useActiveInternships() {
  return useQuery({ queryKey: QK_INTERNSHIPS.active, queryFn: () => getActiveInternships() });
}

export function useCreateInternship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createInternship>[0]["data"]) =>
      createInternship({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_INTERNSHIPS.all });
      qc.invalidateQueries({ queryKey: QK_INTERNSHIPS.active });
      toast.success("Internship added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateInternship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateInternship>[0]["data"]) =>
      updateInternship({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_INTERNSHIPS.all });
      qc.invalidateQueries({ queryKey: QK_INTERNSHIPS.active });
      toast.success("Internship updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteInternship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInternship({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_INTERNSHIPS.all });
      qc.invalidateQueries({ queryKey: QK_INTERNSHIPS.active });
      toast.success("Internship removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Wi-Fi ─────────────────────────────────────────────────────────────────────

import {
  getWifiPackages, createWifiPackage, updateWifiPackage, deleteWifiPackage,
  getWifiSubscriptions, getWifiPayments, getWifiAccounts, setWifiAccountActive,
  getStudentWifiInfo,
} from "./api/wifi.functions";

export const QK_WIFI = {
  packages: ["wifi-packages"] as const,
  subscriptions: (status?: string) => ["wifi-subscriptions", status ?? "all"] as const,
  payments: (status?: string) => ["wifi-payments", status ?? "all"] as const,
  accounts: ["wifi-accounts"] as const,
  studentInfo: (studentId: string) => ["wifi-student", studentId] as const,
};

export function useWifiPackages() {
  return useQuery({ queryKey: QK_WIFI.packages, queryFn: () => getWifiPackages() });
}

export function useCreateWifiPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createWifiPackage>[0]["data"]) => createWifiPackage({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK_WIFI.packages }); toast.success("Package created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWifiPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateWifiPackage>[0]["data"]) => updateWifiPackage({ data }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK_WIFI.packages }); toast.success("Package updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWifiPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWifiPackage({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QK_WIFI.packages }); toast.success("Package deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useWifiSubscriptions(status?: string) {
  return useQuery({
    queryKey: QK_WIFI.subscriptions(status),
    queryFn: () => getWifiSubscriptions({ data: { status } }),
  });
}

export function useWifiPayments(status?: string) {
  return useQuery({
    queryKey: QK_WIFI.payments(status),
    queryFn: () => getWifiPayments({ data: { status } }),
  });
}

export function useWifiAccounts() {
  return useQuery({ queryKey: QK_WIFI.accounts, queryFn: () => getWifiAccounts() });
}

export function useSetWifiAccountActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; is_active: boolean }) => setWifiAccountActive({ data }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QK_WIFI.accounts });
      toast.success(vars.is_active ? "Wi-Fi access restored" : "Wi-Fi access suspended");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useStudentWifiInfo(studentId: string) {
  return useQuery({
    queryKey: QK_WIFI.studentInfo(studentId),
    queryFn: () => getStudentWifiInfo({ data: { student_id: studentId } }),
    enabled: !!studentId,
  });
}

// ── Transportation Agencies ───────────────────────────────────────────────────

import {
  getTransportAgencies, getActiveTransportAgencies,
  createTransportAgency, updateTransportAgency, deleteTransportAgency,
} from "./api/transportation.functions";

export const QK_TRANSPORT = {
  all: ["transport-agencies"] as const,
  active: ["transport-agencies", "active"] as const,
};

export function useTransportAgencies() {
  return useQuery({ queryKey: QK_TRANSPORT.all, queryFn: () => getTransportAgencies() });
}

export function useActiveTransportAgencies() {
  return useQuery({ queryKey: QK_TRANSPORT.active, queryFn: () => getActiveTransportAgencies() });
}

export function useCreateTransportAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createTransportAgency>[0]["data"]) =>
      createTransportAgency({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_TRANSPORT.all });
      qc.invalidateQueries({ queryKey: QK_TRANSPORT.active });
      toast.success("Agency added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTransportAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateTransportAgency>[0]["data"]) =>
      updateTransportAgency({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_TRANSPORT.all });
      qc.invalidateQueries({ queryKey: QK_TRANSPORT.active });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransportAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTransportAgency({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_TRANSPORT.all });
      qc.invalidateQueries({ queryKey: QK_TRANSPORT.active });
      toast.success("Agency removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
