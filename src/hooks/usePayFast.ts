import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export interface AdminPayFastConfig {
  configured: boolean;
  merchant_id: string;
  merchant_key_set: boolean;
  passphrase_set: boolean;
  sandbox: boolean;
  merchant_name: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
}

export interface PayFastRedirectData {
  base_url: string;
  payment_ref: string;
  amount: string;
  signature: string;
  fields: Record<string, string>;
}

export function useAdminPayFastConfig() {
  return useQuery({
    queryKey: ["admin", "payfast-config"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_payfast_config_admin");
      if (error) throw new Error(error.message);
      return data as unknown as AdminPayFastConfig;
    },
  });
}

export function useSetPayFastConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      merchant_id?: string;
      merchant_key?: string;
      passphrase?: string;
      sandbox?: boolean;
      merchant_name?: string;
      return_url?: string;
      cancel_url?: string;
      notify_url?: string;
    }) => {
      const { error } = await supabase.rpc("set_payfast_config", {
        p_merchant_id: input.merchant_id,
        p_merchant_key: input.merchant_key,
        p_passphrase: input.passphrase,
        p_sandbox: input.sandbox,
        p_merchant_name: input.merchant_name,
        p_return_url: input.return_url,
        p_cancel_url: input.cancel_url,
        p_notify_url: input.notify_url,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "payfast-config"] });
    },
  });
}

export async function beginPayFastPayment(orderNumbers: string[]): Promise<string> {
  const { data, error } = await supabase.rpc("begin_payfast_payment", {
    p_order_numbers: orderNumbers,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not start the PayFast payment.");
  return data as string;
}

export async function getPayFastRedirectData(paymentRef: string): Promise<PayFastRedirectData> {
  const { data, error } = await supabase.rpc("payfast_redirect_data", {
    p_payment_ref: paymentRef,
  });
  if (error) throw new Error(error.message);
  return data as unknown as PayFastRedirectData;
}

export function submitPayFastForm(redirect: PayFastRedirectData) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = redirect.base_url + "/eng/process";
  form.style.display = "none";
  for (const [key, value] of Object.entries(redirect.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}