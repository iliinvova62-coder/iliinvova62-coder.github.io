drop policy "profiles select" on public.profiles;

create policy "profiles select" on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.has_role(auth.uid(), 'admin')
  or public.has_role(profiles.id, 'teacher')
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