// app/api/friendnet/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";


async function forwardRequest(req: NextRequest, method: string, path: string[]) {
  const url = `${process.env.DOTNET_PUBLIC_API_URL}/friendnet/${path.join("/")}${req.nextUrl.search}`;
  
  // 1. Prepare clean headers
  const forwardHeaders = new Headers();
  forwardHeaders.set("Content-Type", "application/json");
  
  // 2. Explicitly forward the Cookie
  const cookie = req.headers.get("cookie");
  if (cookie) forwardHeaders.set("cookie", cookie);

  // 3. Explicitly forward Authorization if it exists
  const auth = req.headers.get("authorization");
  if (auth) forwardHeaders.set("authorization", auth);

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    // This forwards the 'jwt=...' cookie exactly as your curl did
    forwardHeaders.set("cookie", cookieHeader);
    // console.log("Forwarding Cookies:", cookieHeader);
  }

  let body;
  if (!["GET", "HEAD"].includes(method)) {
    body = await req.text();
    console.log("Forwarding Body:", body);
  }

  try {
    const res = await fetch(url, {
      method,
      headers: forwardHeaders,
      body: body,
    });

    const backendData = await res.text();
    console.log("Backend Status:", res.status);
    console.log("Backend Raw Response:", backendData);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(backendData);
    } catch {
      jsonResponse = backendData;
    }

    const response = NextResponse.json(jsonResponse, {
      status: res.status,
      headers: { 
        "Content-Type": "application/json",
        // These allow the browser to share cookies with this API route
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": `${process.env.NEXT_PUBLIC_API_URL}`,
      },
    });

    console.log(jsonResponse);
    if (jsonResponse?.token) {
      response.cookies.set("jwt", jsonResponse.token, {
        httpOnly: true, // Security: Prevents JS from reading it
        secure: false,  // Set to true in production (HTTPS)
        sameSite: "lax",
        path: "/",      // Available everywhere in your app
      });
    }
    return response

  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Internal Proxy Error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, "GET", path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, "POST", path);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, "PUT", path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, "PATCH", path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, "DELETE", path);
}