-- Neon compatibility: payment-method writes are restricted to authenticated admins.
CREATE POLICY payment_methods_admin_insert
ON public.payment_methods
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR is_admin = TRUE)
  )
);

CREATE POLICY payment_methods_admin_update
ON public.payment_methods
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR is_admin = TRUE)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR is_admin = TRUE)
  )
);

CREATE POLICY payment_methods_admin_delete
ON public.payment_methods
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR is_admin = TRUE)
  )
);
