prompt para auxiliar na regra de negocio, com o contexto do projeto e o codigo voce pode alterar algumas coisas daqui adicionar mais informações e funcionalidades, auxiliar a estruturar novas features e montar o supabase com as tabelas e configurações necessarias.

You are a senior software architect.

Your task is to analyze this project and generate a full system design and implementation plan.

Context:

This project is a church ministry management system.

The system manages:

- church members
- ministry areas
- service schedules
- member assignments

The backend uses:

- Supabase
- PostgreSQL
- Authentication via Supabase Auth

You must analyze the existing project structure and generate a **complete planning document** including:

1. Database schema
2. Supabase migrations
3. RLS policies
4. Business rules
5. Folder structure
6. Backend service architecture
7. Entities and relations
8. Queries needed
9. Edge cases

---

SYSTEM RULES

The system has three main user types:

Admin
Leader
Member

Admin:
- manages everything
- creates ministries
- manages members
- can create schedules
- can assign members to schedules

Leader:
- manages only their ministry
- can create schedules
- can assign members to schedules

Member:
- can only view schedules from ministries they belong to
- can see when they were assigned

If a member does not belong to any ministry:
they cannot see any schedule.

---

MINISTRIES

The system must support dynamic ministry creation.

Examples:

- Worship
- Deacons
- Sunday School
- Kids
- Media

Each ministry has:

- members
- leaders
- roles/functions

Example roles for Worship:

- Vocal
- Guitar
- Drums
- Keyboard

---

SCHEDULES

A schedule represents a service date.

Example:

Sunday Service – 2026-04-10

Inside a schedule we assign members to ministry roles.

Example:

Worship Team

Vocal – João  
Guitar – Pedro  
Drums – Lucas  

---

IMPORTANT RULES

A member can:

- belong to multiple ministries
- be assigned to multiple schedules
- be leader of multiple ministries

If a member belongs to a ministry, they can see all schedules from that ministry.

However, the UI must highlight schedules where the user was assigned.

---

DATABASE

You must design the database using PostgreSQL with Supabase.

Include:

- tables
- constraints
- indexes
- relationships
- row level security

---

OUTPUT FORMAT

Generate:

1️⃣ Database schema (tables)

2️⃣ SQL migrations

3️⃣ RLS policies

4️⃣ Example queries

5️⃣ API endpoints

6️⃣ Backend architecture

7️⃣ TODO planning files for implementation

---

The output must be highly detailed.
Think step by step like a senior backend architect.