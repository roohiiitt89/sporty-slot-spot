
import { useToast as useToastShadcn } from "@/components/ui/toast";

export const useToast = useToastShadcn;

export function toast(props: Parameters<typeof useToastShadcn>[0]['toast']) {
  const { toast } = useToastShadcn();
  toast(props);
}
