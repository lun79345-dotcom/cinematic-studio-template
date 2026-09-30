"use client";
import Image from "next/image";
import { withBasePath } from "@/lib/base-path";
export function TrainingHeroScene({reduceMotion}:{reduceMotion:boolean|null}) { return <div className="absolute inset-y-0 right-[-12%] hidden w-[68%] lg:block" data-training-scene={reduceMotion ? "reduced" : "static"}><Image src={withBasePath("/images/creative-workshop.webp")} alt="" fill sizes="68vw" className="object-cover"/><div className="absolute inset-0 bg-[rgb(var(--training-dark)/0.1)]"/></div>; }
