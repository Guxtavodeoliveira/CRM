/* =========================================================
   config.js — ligação com o Supabase.

   Estes dois valores são feitos para ficar no navegador; eles
   não dão acesso a nada sozinhos. Quem protege os dados é a
   RLS, que já está ligada em todas as tabelas: cada usuário
   só enxerga as próprias linhas.

   NUNCA coloque aqui a "service_role key" nem a senha do banco.
   ========================================================= */

const SUPABASE_URL = "https://gpjjfjcyypsgmhqcpuxh.supabase.co";
const SUPABASE_KEY = "sb_publishable_tTdzK-4eablwAJVC5jPaNg_YtbtfYgX";

/* Cliente único, usado por todas as telas. */
const sb = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,        // continua logado ao fechar a aba
        autoRefreshToken: true,
        detectSessionInUrl: true     // necessário para o link do e-mail
      }
    })
  : null;

/* Onde o usuário volta depois de clicar no link do e-mail. */
function urlDoApp(pagina){
  const base = location.origin + location.pathname.replace(/[^/]*$/, "");
  return base + (pagina || "");
}
