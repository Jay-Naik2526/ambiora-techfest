class LamportClock {
    static int max(int a, int b) {
        if (a>b)
            return a;
        else
            return b;
    }
    static void display(int e1, int e2, int[] p1, int[] p2) {
        System.out.println("Timestamps of events in Process P1:");
        for (int i=0; i<e1; i++) {
            System.out.print(p1[i] + " ");
        }
        System.out.println("Timestamps of events in Process P2:");
        for (int i=0; i<e2; i++) {
            System.out.print(p2[i] + " ");
        }
    }
    static void lamportLogicalClock(int e1, int e2, int[][] m) {
        int[] p1 = new int[e1];
        int[] p2 = new int[e2];
        for (int i=0; i<e1; i++)
            p1[i] = i + 1;
        for (int i=0; i<e2; i++)
            p2[i] = i + 1;
        for (int i=0; i<e1; i++) {
            for (int j=0; j<e2; j++) {
                if (m[i][j] == 1) {
                    p2[j] = max(p2[j], p1[i] + 1);
                    for (int k=j+1; k<e2; k++)
                        p2[k] = p2[k-1] + 1;
                }
                if (m[i][j] == -1) {
                    p1[i] = max(p1[i], p2[j] + 1);
                    for (int k=i+1; k<e1; k++)
                        p1[k] = p1[k-1] + 1;
                }
            }
        }
        display(e1, e2, p1, p2);
    }
    public static void main(String[] args) {
        int e1 = 5;
        int e2 = 3;
        int[][] m = {
            {0, 0, 0},
            {0, 0, 1},
            {0, 0, 0},
            {0, 0, 0},
            {0, -1, 0}
        };
        lamportLogicalClock(e1, e2, m);
    }
}
