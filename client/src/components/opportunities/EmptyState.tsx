const EmptyState = ({ type, icon, message }: { type: string, icon: string, message?: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-8 text-center">
    <i className={`fas ${icon} text-4xl text-neutral-300 mb-3`}></i>
    <h3 className="text-lg font-medium mb-1">No {type} available</h3>
    <p className="text-neutral-500">
      {message || `Check back soon for new ${type.toLowerCase()} opportunities`}
    </p>
  </div>
);

export default EmptyState;
