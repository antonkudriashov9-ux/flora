import { FlowerShop } from "@/components/flowers/shop";
import products from "@/lib/flowers.json";
export default function Home() { return <FlowerShop products={products} />; }
