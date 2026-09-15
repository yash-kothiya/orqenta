"use client";

import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { listUsers } from "@/app/(app)/users/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type User } from "@/lib/types";

function userLabel(user: User): string {
  return user.displayName || user.username;
}

export function UserList() {
  const {
    data: usersList = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["users", "list"],
    queryFn: async () => {
      try {
        const result = await listUsers();
        if (!result.ok) {
          console.error("Failed to load users:", result.error);
          throw new Error(result.error || "Failed to load users");
        }
        return result.data;
      } catch (err) {
        console.error("User list error:", err);
        throw err;
      }
    },
    retry: false,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Alert variant="destructive">
          <AlertTitle>{(error as Error).message}</AlertTitle>
        </Alert>
      </div>
    );
  }

  if (usersList.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <Card className="items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">No users found.</p>
          <Button render={<Link href="/users/new" />}>Create a user</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />

      {/* Mobile: one card per user. */}
      <div className="flex flex-col gap-3 sm:hidden">
        {usersList.map((user) => (
          <Card key={user.id} className="gap-1 px-4 py-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${user.id}`}
                className="font-medium hover:underline"
              >
                {userLabel(user)}
              </Link>
              <RoleBadge user={user} adminOnly />
            </div>
            <p className="text-sm text-muted-foreground">{user.email ?? "—"}</p>
          </Card>
        ))}
      </div>

      <Card className="hidden gap-0 py-0 sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-4">Name</TableHead>
              <TableHead className="px-4">Email</TableHead>
              <TableHead className="w-24 px-4">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-4 font-medium">
                  <Link href={`/users/${user.id}`} className="hover:underline">
                    {userLabel(user)}
                  </Link>
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">
                  {user.email ?? "—"}
                </TableCell>
                <TableCell className="w-24 px-4">
                  <RoleBadge user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/** `adminOnly` keeps the mobile card quiet for plain users (§10.12). */
function RoleBadge({
  user,
  adminOnly,
}: {
  user: User;
  adminOnly?: boolean;
}) {
  if (user.isAdmin) return <Badge>Admin</Badge>;
  if (adminOnly) return null;
  return <Badge variant="ghost">User</Badge>;
}

function Header() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold">Users</h1>
      <Button className="w-full sm:w-auto" render={<Link href="/users/new" />}>
        <UserPlus className="size-4" />
        New User
      </Button>
    </div>
  );
}
