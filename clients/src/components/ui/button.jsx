
function Button({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}) {
  let classes =
    "inline-flex items-center justify-center transition-all outline-none disabled:pointer-events-none disabled:opacity-50";

  // Variant
  switch (variant) {
    case "outline":
      classes += " border";
      break;

    case "ghost":
      classes += " bg-transparent";
      break;

    case "destructive":
      classes += " bg-red-600 text-white";
      break;

    default:
      classes += " bg-blue-600 text-white";
  }

  // Size
  switch (size) {
    case "sm":
      classes += " h-8 px-3";
      break;

    case "lg":
      classes += " h-12 px-6";
      break;

    case "icon":
      classes += " w-10 h-10";
      break;

    default:
      classes += " h-10 px-4";
  }

  if (className) {
    classes += ` ${className}`;
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;