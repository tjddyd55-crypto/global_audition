'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Stripe는 포인트 충전 기능이 완성될 때까지 임시로 주석 처리
// import { loadStripe } from '@stripe/stripe-js';

/**
 * 포인트 지갑 페이지
 * 작업: POINTS_05_frontend_wallet
 */
export default function WalletPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [topupAmount, setTopupAmount] = useState<number>(1000);
    const [isProcessing, setIsProcessing] = useState(false);

    // 포인트 잔액 조회
    const { data: balance, isLoading: balanceLoading } = useQuery({
        queryKey: ['points', 'balance'],
        queryFn: async () => {
            const response = await fetch('/api/v1/points/balance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('포인트 잔액 조회 실패');
            const data = await response.json();
            return data.balance as number;
        },
    });

    // 포인트 거래 내역 조회
    const { data: transactions, isLoading: transactionsLoading } = useQuery({
        queryKey: ['points', 'transactions'],
        queryFn: async () => {
            const response = await fetch('/api/v1/points/transactions?page=0&size=20', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('거래 내역 조회 실패');
            const data = await response.json();
            return data.content as any[];
        },
    });

    // 포인트 충전 Intent 생성
    const topupMutation = useMutation({
        mutationFn: async (points: number) => {
            const response = await fetch('/api/v1/points/topup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ points }),
            });
            if (!response.ok) throw new Error('포인트 충전 Intent 생성 실패');
            return response.json();
        },
        onSuccess: async (data) => {
            // Stripe 결제 처리 (임시로 주석 처리 - 포인트 충전 기능 완성 시 활성화)
            setIsProcessing(true);
            try {
                // TODO: Stripe 결제 처리 구현 필요
                // const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
                // if (!stripe) {
                //     throw new Error('Stripe 초기화 실패');
                // }
                // const { error } = await stripe.confirmCardPayment(data.clientSecret);
                // if (error) {
                //     throw new Error(error.message);
                // }
                
                // 성공 시 잔액 갱신
                queryClient.invalidateQueries({ queryKey: ['points'] });
                alert('포인트 충전이 완료되었습니다!');
            } catch (error: any) {
                alert('결제 처리 중 오류가 발생했습니다: ' + error.message);
            } finally {
                setIsProcessing(false);
            }
        },
        onError: (error: any) => {
            alert('포인트 충전 실패: ' + error.message);
        },
    });

    const handleTopup = () => {
        if (topupAmount < 1) {
            alert('충전할 포인트는 1 이상이어야 합니다');
            return;
        }
        topupMutation.mutate(topupAmount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    const formatAmount = (amount: number) => {
        return amount > 0 ? `+${amount.toLocaleString()}` : `${amount.toLocaleString()}`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">포인트 지갑</h1>

            {/* 포인트 잔액 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">현재 잔액</h2>
                {balanceLoading ? (
                    <div className="text-gray-500">로딩 중...</div>
                ) : (
                    <div className="text-4xl font-bold text-blue-600">
                        {balance?.toLocaleString() || 0} P
                    </div>
                )}
            </div>

            {/* 포인트 충전 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">포인트 충전</h2>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            충전할 포인트
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="충전할 포인트를 입력하세요"
                        />
                    </div>
                    <button
                        onClick={handleTopup}
                        disabled={isProcessing || topupMutation.isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? '처리 중...' : '충전하기'}
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    * 1원 = 1포인트 (Stripe 결제)
                </p>
            </div>

            {/* 거래 내역 */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">거래 내역</h2>
                {transactionsLoading ? (
                    <div className="text-gray-500">로딩 중...</div>
                ) : transactions && transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-4">날짜</th>
                                    <th className="text-left py-2 px-4">유형</th>
                                    <th className="text-left py-2 px-4">이벤트</th>
                                    <th className="text-right py-2 px-4">포인트</th>
                                    <th className="text-right py-2 px-4">잔액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="border-b">
                                        <td className="py-2 px-4">
                                            {formatDate(tx.createdAt)}
                                        </td>
                                        <td className="py-2 px-4">
                                            {tx.transactionType === 'CHARGE' ? '충전' :
                                             tx.transactionType === 'DEDUCTION' ? '차감' :
                                             tx.transactionType === 'REFUND' ? '환불' : tx.transactionType}
                                        </td>
                                        <td className="py-2 px-4">
                                            {tx.description || tx.eventType || '-'}
                                        </td>
                                        <td className={`py-2 px-4 text-right ${
                                            tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatAmount(tx.amount)}
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            {tx.balanceAfter.toLocaleString()} P
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-gray-500">거래 내역이 없습니다</div>
                )}
            </div>
        </div>
    );
}
