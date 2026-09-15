create type public.app_role as enum ('student', 'teacher', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  grade int,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  bio text,
  experience_years int not null default 0,
  subjects text not null default 'Математика',
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade int,
  teacher_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  student_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz not null default now(),
  unique (group_id, student_id)
);

create table public.lesson_requests (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  contact text not null,
  grade int,
  goal text not null default '',
  format text not null default 'individual' check (format in ('individual','group')),
  preferred_time text,
  status text not null default 'new' check (status in ('new','contacted','assigned','closed')),
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete set null not null,
  format text not null default 'individual' check (format in ('individual','group')),
  starts_at timestamptz not null,
  duration_min int not null default 60,
  lesson_link text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now(),
  constraint lessons_target_check check (student_id is not null or group_id is not null)
);

create table public.lesson_reports (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade not null unique,
  topic text,
  homework text,
  feedback text,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lessons_count int not null,
  price numeric(10,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade not null,
  package_id uuid references public.packages(id) on delete set null,
  lessons_count int not null default 0,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  provider text,
  provider_ref text,
  created_at timestamptz not null default now()
);

-- Grants
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.teachers to authenticated;
grant select on public.groups to authenticated;
grant select on public.group_members to authenticated;
grant insert on public.lesson_requests to anon;
grant select, update, delete on public.lesson_requests to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update on public.lesson_reports to authenticated;
grant select on public.packages to anon;
grant select, insert, update, delete on public.packages to authenticated;
grant select, insert, update on public.payments to authenticated;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;
grant all on public.teachers to service_role;
grant all on public.groups to service_role;
grant all on public.group_members to service_role;
grant all on public.lesson_requests to service_role;
grant all on public.lessons to service_role;
grant all on public.lesson_reports to service_role;
grant all on public.packages to service_role;
grant all on public.payments to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teachers enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.lesson_requests enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_reports enable row level security;
alter table public.packages enable row level security;
alter table public.payments enable row level security;

-- Role-check helper (security definer avoids recursive RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- Profiles policies
create policy "profiles select" on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
  or (
    public.has_role(auth.uid(), 'teacher')
    and exists (
      select 1 from public.lessons l
      where l.teacher_id = auth.uid()
        and (
          l.student_id = profiles.id
          or l.group_id in (select gm.group_id from public.group_members gm where gm.student_id = profiles.id)
        )
    )
  )
);

create policy "profiles update" on public.profiles for update to authenticated
using (id = auth.uid() or public.has_role(auth.uid(), 'admin'))
with check (id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- User roles policies
create policy "user_roles select" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "user_roles manage" on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Teachers policies
create policy "teachers read" on public.teachers for select to authenticated using (true);
create policy "teachers manage" on public.teachers for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Groups policies
create policy "groups select" on public.groups for select to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or teacher_id = auth.uid()
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id and gm.student_id = auth.uid()
  )
);
create policy "groups manage" on public.groups for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Group members policies
create policy "group_members select" on public.group_members for select to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or student_id = auth.uid()
  or exists (
    select 1 from public.groups g
    where g.id = group_members.group_id and g.teacher_id = auth.uid()
  )
);
create policy "group_members manage" on public.group_members for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Lesson requests policies
create policy "lesson_requests anon submit" on public.lesson_requests for insert to anon with check (true);
create policy "lesson_requests admin read" on public.lesson_requests for select to authenticated
using (public.has_role(auth.uid(), 'admin'));
create policy "lesson_requests admin update" on public.lesson_requests for update to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "lesson_requests admin delete" on public.lesson_requests for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Lessons policies
create policy "lessons select" on public.lessons for select to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or teacher_id = auth.uid()
  or student_id = auth.uid()
  or (
    group_id is not null
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = lessons.group_id and gm.student_id = auth.uid()
    )
  )
);
create policy "lessons insert" on public.lessons for insert to authenticated
with check (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and teacher_id = auth.uid())
);
create policy "lessons update" on public.lessons for update to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and teacher_id = auth.uid())
)
with check (
  public.has_role(auth.uid(), 'admin')
  or (public.has_role(auth.uid(), 'teacher') and teacher_id = auth.uid())
);
create policy "lessons delete" on public.lessons for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Lesson reports policies
create policy "lesson_reports select" on public.lesson_reports for select to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.lessons l where l.id = lesson_reports.lesson_id and l.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.lessons l
    where l.id = lesson_reports.lesson_id
      and (
        l.student_id = auth.uid()
        or (l.group_id is not null and exists (
          select 1 from public.group_members gm
          where gm.group_id = l.group_id and gm.student_id = auth.uid()
        ))
      )
  )
);
create policy "lesson_reports write" on public.lesson_reports for insert to authenticated
with check (
  public.has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.lessons l where l.id = lesson_reports.lesson_id and l.teacher_id = auth.uid()
  )
);
create policy "lesson_reports update" on public.lesson_reports for update to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.lessons l where l.id = lesson_reports.lesson_id and l.teacher_id = auth.uid()
  )
)
with check (
  public.has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.lessons l where l.id = lesson_reports.lesson_id and l.teacher_id = auth.uid()
  )
);

-- Packages policies
create policy "packages read" on public.packages for select to anon, authenticated
using (active or public.has_role(auth.uid(), 'admin'));
create policy "packages manage" on public.packages for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Payments policies
create policy "payments select" on public.payments for select to authenticated
using (student_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "payments manage" on public.payments for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + student role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();