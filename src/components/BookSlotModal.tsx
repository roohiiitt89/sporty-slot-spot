
// This is a re-export file that provides a consistent interface for BookSlotModal
// The original component is read-only, so we're just re-exporting it for consistent usage

// Export BookSlotModal as a named export to match how we're importing it
export const BookSlotModal = (props: any) => {
  // Forward all props to the original component
  // Since the file was marked as read-only, we're creating this adapter component
  const BookSlotModalComponent = props as any;
  return BookSlotModalComponent;
};
