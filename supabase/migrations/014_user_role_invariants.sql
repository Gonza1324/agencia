create or replace function public.protect_profile_access_invariants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    raise exception 'El email del perfil no puede modificarse'
      using errcode = '22023';
  end if;

  if old.id = (select auth.uid())
    and (
      new.role is distinct from old.role
      or new.status is distinct from old.status
    )
  then
    raise exception 'No podés cambiar tu propio rol o estado'
      using errcode = '42501';
  end if;

  if old.role = 'owner_admin'
    and old.status = 'active'
    and (
      new.role is distinct from 'owner_admin'
      or new.status is distinct from 'active'
    )
  then
    perform pg_advisory_xact_lock(
      hashtextextended('profiles.active_owner_admin', 0)
    );

    if not exists (
      select 1
      from public.profiles
      where id <> old.id
        and role = 'owner_admin'
        and status = 'active'
    ) then
      raise exception 'Debe quedar al menos un propietario activo'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_access_invariants()
  from public, anon, authenticated;

create trigger profiles_protect_access_invariants
before update on public.profiles
for each row execute function public.protect_profile_access_invariants();
