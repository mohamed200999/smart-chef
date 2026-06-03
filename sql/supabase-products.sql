-- Supabase products table schema for Smart Chef Uniform
-- انسخ هذا الاستعلام إلى SQL Editor في لوحة Supabase

create table if not exists products (
  id text primary key,
  nameAr text,
  nameEn text,
  category text,
  price numeric,
  image text,
  descriptionAr text,
  available boolean,
  stock jsonb
);

-- للتحديثات العامة، تأكد من تعطيل RLS أو إضافة سياسة تسمح للمفتاح العام بالقراءة والكتابة.
