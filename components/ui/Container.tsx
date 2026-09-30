import { ComponentPropsWithoutRef, ElementType } from "react";

type ContainerProps<T extends ElementType> = { as?: T } & ComponentPropsWithoutRef<T>;

// 所有页面内容共享 1400px 上限和响应式边距。
export function Container<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: ContainerProps<T>) {
  const Component = as ?? "div";
  return (
    <Component
      className={`mx-auto w-full max-w-content px-5 sm:px-8 lg:px-10 min-[1920px]:max-w-[1680px] min-[1920px]:px-14 ${className}`}
      {...props}
    />
  );
}
