-- Fix "Function Search Path Mutable" Warnings
-- This script dynamically finds the flagged functions in the public schema by name
-- and sets their search_path to 'public', avoiding errors with mismatched argument types.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname IN (
            'get_user_role',
            'get_reportes_completos',
            'update_updated_at_column',
            'sync_user_after_signup',
            'create_user_record',
            'handle_new_user',
            'update_user_role',
            'finalize_purchase_batch',
            'fn_set_owner',
            'fn_finalize_order',
            'fn_cancel_order'
        )
        AND pronamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE 'Securing function: %', r.func_signature;
        EXECUTE 'ALTER FUNCTION ' || r.func_signature || ' SET search_path = public';
    END LOOP;
END $$;
