import prisma from "@/lib/prisma";

export default async function Home() {
  let users: Array<{ id: string; email: string; name: string | null }> = [];

  try {
    users = await prisma.user.findMany();
  } catch (e) {
    console.error(e);
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Users</h1>

      {users.length === 0 ? (
        <p>No users yet</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.email} - {u.name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
