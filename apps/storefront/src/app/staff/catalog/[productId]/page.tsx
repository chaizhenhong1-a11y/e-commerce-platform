import { ProductEditor } from "@/features/staff/components/product-editor";
export default async function EditProductPage({params}:{params:Promise<{productId:string}>}){const {productId}=await params;return <ProductEditor productId={productId}/>;}
