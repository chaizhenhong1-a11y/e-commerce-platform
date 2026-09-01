import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

async function proxy(path:string, method:string, request?:NextRequest){
  const body=request && method!=="GET" ? await request.json().catch(()=>undefined) : undefined;
  const {upstream,refreshedTokens}=await callApiWithSession(path,{method,headers:body===undefined?undefined:{"content-type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  if(!upstream)return NextResponse.json({message:"Not signed in."},{status:401});
  const payload=await upstream.json().catch(()=>null);
  const response=NextResponse.json(payload??{}, {status:upstream.status});
  if(refreshedTokens)applyAuthCookies(response,refreshedTokens);
  return response;
}
async function pathOf(ctx:{params:Promise<{variantId:string}>}){const {variantId}=await ctx.params;return `/staff/catalog/variants/${encodeURIComponent(variantId)}`;}
export async function PATCH(request:NextRequest,ctx:{params:Promise<{variantId:string}>}){return proxy(await pathOf(ctx),"PATCH",request);}
export async function DELETE(request:NextRequest,ctx:{params:Promise<{variantId:string}>}){return proxy(await pathOf(ctx),"DELETE",request);}
