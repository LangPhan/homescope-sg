import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Providers } from "@/_app/providers/providers";
import { ListingCard } from "./listing-card";
import { demoListings } from "@/shared/api";
vi.mock("next/image",()=>({default:(props:Record<string,unknown>)=>{const {fill,priority,...rest}=props;void fill;void priority;return <img {...rest as React.ImgHTMLAttributes<HTMLImageElement>}/>;}}));
describe("ListingCard",()=>{it("renders decision-critical property facts",()=>{render(<Providers><ListingCard listing={demoListings[0]}/></Providers>);expect(screen.getByText("Marina One Residences")).toBeInTheDocument();expect(screen.getByText(/2,380,000/)).toBeInTheDocument();expect(screen.getByRole("link",{name:"Sign in to save home"})).toBeInTheDocument();});});
