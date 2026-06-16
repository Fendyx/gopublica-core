export default function CancelPage() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <h1 className="text-2xl font-heading font-bold mb-4">Оплата отменена</h1>
      <p className="text-gray-600">Вы можете вернуться в корзину и попробовать снова.</p>
      <a href="/" className="mt-6 inline-block px-6 py-2 bg-primary text-white rounded-full">На главную</a>
    </div>
  );
}