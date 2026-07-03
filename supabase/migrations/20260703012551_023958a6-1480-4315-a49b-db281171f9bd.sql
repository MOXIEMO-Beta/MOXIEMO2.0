revoke execute on function public.email_queue_wake() from public;
revoke execute on function public.email_queue_dispatch() from public;
revoke execute on function public.email_queue_wake() from anon, authenticated;
revoke execute on function public.email_queue_dispatch() from anon, authenticated;