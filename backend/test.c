#include <stdio.h>

int main(void) {
    int n, i;
    int bt[10], wt[10], tat[10];
    int total_wt = 0, total_tat = 0;
    char pname[10][10];

    printf("Enter the number of processes: ");
    scanf("%d", &n);

    for (i = 0; i < n; ++i) {
        printf("Enter the process name %d: ", i);
        scanf("%9s", pname[i]);
        printf("Enter the burst time of process %d: ", i);
        scanf("%d", &bt[i]);
    }

    wt[0] = 0;
    for (i = 1; i < n; ++i)
        wt[i] = wt[i - 1] + bt[i - 1];

    for (i = 0; i < n; ++i)
        tat[i] = wt[i] + bt[i];

    for (i = 0; i < n; ++i) {
        total_wt += wt[i];
        total_tat += tat[i];
    }

    printf("\nProcess\tBurst\tWaiting\tTurnaround\n");
    printf("=======\t=====\t=======\t==========\n");
    for (i = 0; i < n; ++i)
        printf("%s\t%d\t%d\t%d\n", pname[i], bt[i], wt[i], tat[i]);

    printf("\nTotal waiting time is %d", total_wt);
    printf("\nAverage waiting time is %.2f", (float) total_wt / n);
    printf("\nTotal Turnaround time is %d", total_tat);
    printf("\nAverage Turnaround time is %.2f\n", (float) total_tat / n);

    printf("\nGANTT CHART:\n");
    printf("-------------\n");
    for (i = 0; i < n; ++i)
        printf("| %s ", pname[i]);
    printf("|\n");

    int time = 0;
    for (i = 0; i < n; ++i) {
        printf("%d\t", time);
        time += bt[i];
    }
    printf("%d\n", time);

    return 0;
}





//2
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

#define NUM_THREADS 3

void* thread_function(void* arg) {
    int id = *(int*)arg;

    for (int i = 0; i < 5; i++) {
        printf("Thread %d: iteration %d\n", id, i + 1);
        sleep(1);   // simulate work
    }

    return NULL;
}

int main() {
    pthread_t threads[NUM_THREADS];
    int thread_ids[NUM_THREADS];

    // Create threads
    for (int i = 0; i < NUM_THREADS; i++) {
        thread_ids[i] = i + 1;
        pthread_create(&threads[i], NULL, thread_function, &thread_ids[i]);
    }

    // Wait for threads to finish
    for (int i = 0; i < NUM_THREADS; i++) {
        pthread_join(threads[i], NULL);
    }

    printf("All threads finished execution.\n");
    return 0;
}


//3
#include <stdio.h>
#include <stdlib.h>

int mutex = 1;     // Mutual exclusion semaphore
int full = 0;      // Number of filled slots
int empty;         // Number of empty slots
int n;             // Buffer size

int buffer[50];
int in = 0, out = 0;

void wait(int *s) {
    (*s)--;
}

void signal(int *s) {
    (*s)++;
}

void producer(int item) {
    wait(&empty);
    wait(&mutex);

    buffer[in] = item;
    in = (in + 1) % n;

    signal(&mutex);
    signal(&full);
}

void consumer() {
    int item;

    wait(&full);
    wait(&mutex);

    item = buffer[out];
    out = (out + 1) % n;
    printf("Consumed item = %d\n", item);

    signal(&mutex);
    signal(&empty);
}

int main(void) {
    int item;

    printf("Enter the value of n: ");
    scanf("%d", &n);

    empty = n;

    for (int i = 0; i < n; i++) {
        printf("Enter the item: ");
        scanf("%d", &item);
        producer(item);
    }

    for (int i = 0; i < n; i++) {
        consumer();
    }

    return 0;
}


//4
#include <stdio.h>

typedef struct {
    char name[16];
    int bt, pr, wt, tat;
} Proc;

int main(void) {
    int n, i, j, pos, t = 0;
    int total_wt = 0, total_tat = 0;
    Proc p[32], temp;

    printf("Enter the number of processes: ");
    scanf("%d", &n);

    for (i = 0; i < n; i++) {
        printf("Enter the process name %d: ", i);
        scanf("%15s", p[i].name);
        printf("Enter the burst time of process %d: ", i);
        scanf("%d", &p[i].bt);
        printf("Enter the priority of process %d: ", i);
        scanf("%d", &p[i].pr);
    }

    // Sort processes based on priority
    for (i = 0; i < n - 1; i++) {
        pos = i;
        for (j = i + 1; j < n; j++)
            if (p[j].pr < p[pos].pr)
                pos = j;

        if (pos != i) {
            temp = p[i];
            p[i] = p[pos];
            p[pos] = temp;
        }
    }

    p[0].wt = 0;
    for (i = 1; i < n; i++)
        p[i].wt = p[i - 1].wt + p[i - 1].bt;

    for (i = 0; i < n; i++) {
        p[i].tat = p[i].wt + p[i].bt;
        total_wt += p[i].wt;
        total_tat += p[i].tat;
    }

    printf("\nProcess\tBurst\tWaiting\tTurnaround\tPriority\n");
    printf("=======\t=====\t=======\t==========\t========\n");

    for (i = 0; i < n; i++)
        printf("%s\t%d\t%d\t%d\t\t%d\n",
               p[i].name, p[i].bt, p[i].wt, p[i].tat, p[i].pr);

    printf("\nTotal waiting time is %d", total_wt);
    printf("\nAverage waiting time is %.2f", (float)total_wt / n);
    printf("\nTotal Turnaround time is %d", total_tat);
    printf("\nAverage Turnaround time is %.2f\n", (float)total_tat / n);

    printf("\nGANTT CHART:\n");
    for (i = 0; i < n; i++) printf("------");
    printf("-\n|");
    for (i = 0; i < n; i++) printf(" %s |", p[i].name);
    printf("\n");
    for (i = 0; i < n; i++) printf("------");
    printf("-\n0");

    for (i = 0; i < n; i++) {
        t += p[i].bt;
        printf("%6d", t);
    }
    printf("\n");

    return 0;
}

//5
#include <stdio.h>

int main(void) {
    int n, h, hungry[20], i, j, choice;

    printf("DINING PHILOSOPHER PROBLEM\n");
    printf("Enter the total no. of philosophers: ");
    scanf("%d", &n);

    printf("How many are hungry: ");
    scanf("%d", &h);

    for (i = 0; i < h; ++i) {
        printf("Enter philosopher %d position: ", i + 1);
        scanf("%d", &hungry[i]);
    }

    do {
        printf("\n1.One can eat at a time\n2.Two can eat at a time\n3.Exit\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);

        switch (choice) {
            case 1:
                printf("Allow one philosopher to eat at any time\n");
                for (i = 0; i < h; ++i) {
                    printf("P %d is granted to eat\n", hungry[i]);
                    for (j = 0; j < h; ++j)
                        if (j != i)
                            printf("P %d is waiting ", hungry[j]);
                    printf("\n");
                }
                break;

            case 2:
                printf("Allow two philosophers to eat at same time\n");
                int comb = 1;
                for (i = 0; i < h; ++i) {
                    for (j = i + 1; j < h; ++j) {
                        printf("Combination %d\n", comb++);
                        printf("P %d and P %d are granted to eat ",
                               hungry[i], hungry[j]);
                        for (int k = 0; k < h; ++k)
                            if (k != i && k != j)
                                printf("P %d is waiting ", hungry[k]);
                        printf("\n");
                    }
                }
                break;

            case 3:
                printf("Exiting...\n");
                break;

            default:
                printf("Invalid choice\n");
        }
    } while (choice != 3);

    return 0;
}

//6 15 16 17
#include <stdio.h>

int main() {
    int blocks, processes;
    int blockSize[10], processSize[10];
    int allocation[10];

    printf("Enter number of blocks: ");
    scanf("%d", &blocks);

    printf("Enter size of each block:\n");
    for (int i = 0; i < blocks; i++)
        scanf("%d", &blockSize[i]);

    printf("Enter number of processes: ");
    scanf("%d", &processes);

    printf("Enter size of each process:\n");
    for (int i = 0; i < processes; i++)
        scanf("%d", &processSize[i]);

    for (int i = 0; i < processes; i++)
        allocation[i] = -1;

    for (int i = 0; i < processes; i++) {
        for (int j = 0; j < blocks; j++) {
            if (blockSize[j] >= processSize[i]) {
                allocation[i] = j;
                blockSize[j] -= processSize[i];
                break;
            }
        }
    }

    printf("\nProcess No\tProcess Size\tBlock No\n");
    for (int i = 0; i < processes; i++) {
        if (allocation[i] != -1)
            printf("%d\t\t%d\t\t%d\n", i, processSize[i], allocation[i]);
        else
            printf("%d\t\t%d\t\tNot Allocated\n", i, processSize[i]);
    }

    return 0;
}
#include <stdio.h>
//best fit
int main() {
    int blocks, processes;
    int blockSize[10], processSize[10];
    int allocation[10];

    printf("Enter number of blocks: ");
    scanf("%d", &blocks);

    printf("Enter size of each block:\n");
    for (int i = 0; i < blocks; i++)
        scanf("%d", &blockSize[i]);

    printf("Enter number of processes: ");
    scanf("%d", &processes);

    printf("Enter size of each process:\n");
    for (int i = 0; i < processes; i++)
        scanf("%d", &processSize[i]);

    for (int i = 0; i < processes; i++)
        allocation[i] = -1;

    for (int i = 0; i < processes; i++) {
        int best = -1;
        for (int j = 0; j < blocks; j++) {
            if (blockSize[j] >= processSize[i]) {
                if (best == -1 || blockSize[j] < blockSize[best])
                    best = j;
            }
        }

        if (best != -1) {
            allocation[i] = best;
            blockSize[best] -= processSize[i];
        }
    }

    printf("\nProcess No\tProcess Size\tBlock No\n");
    for (int i = 0; i < processes; i++) {
        if (allocation[i] != -1)
            printf("%d\t\t%d\t\t%d\n", i, processSize[i], allocation[i]);
        else
            printf("%d\t\t%d\t\tNot Allocated\n", i, processSize[i]);
    }

    return 0;
}

//7
#include <stdio.h>

int main(void) {
    int pages[50], frames[10];
    int n, f;
    int i, j, k = 0;
    int flag, page_faults = 0;

    printf("Enter number of pages: ");
    scanf("%d", &n);

    printf("Enter page reference string:\n");
    for (i = 0; i < n; ++i)
        scanf("%d", &pages[i]);

    printf("Enter number of frames: ");
    scanf("%d", &f);

    for (i = 0; i < f; ++i)
        frames[i] = -1;

    printf("\nPage\tFrames\t\tPage Fault\n");
    printf("--------------------------------\n");

    for (i = 0; i < n; ++i) {
        flag = 0;

        // Check for page hit
        for (j = 0; j < f; ++j) {
            if (frames[j] == pages[i]) {
                flag = 1;
                break;
            }
        }

        // Page fault
        if (!flag) {
            frames[k] = pages[i];
            k = (k + 1) % f;
            page_faults++;
        }

        printf("%d\t", pages[i]);
        for (j = 0; j < f; ++j) {
            if (frames[j] != -1)
                printf("%d ", frames[j]);
            else
                printf("- ");
        }

        if (flag)
            printf("\t\tNo\n");
        else
            printf("\t\tYes\n");
    }

    printf("--------------------------------\n");
    printf("Total Page Faults = %d\n", page_faults);

    return 0;
}

//8
#include <stdio.h>

int main(void) {
    int p, r, i, j, k;
    int alloc[10][10], req[10][10];
    int avail[10], total[10];
    int finish[10] = {0};

    printf("Enter no of processes: ");
    scanf("%d", &p);

    printf("Enter no of resource classes: ");
    scanf("%d", &r);

    for (i = 0; i < r; ++i) {
        printf("Enter instances of resource class %d: ", i + 1);
        scanf("%d", &total[i]);
        printf("Enter available resources of class %d: ", i + 1);
        scanf("%d", &avail[i]);
    }

    printf("Enter the allocation matrix:\n");
    for (i = 0; i < p; ++i)
        for (j = 0; j < r; ++j)
            scanf("%d", &alloc[i][j]);

    printf("Enter the request matrix:\n");
    for (i = 0; i < p; ++i)
        for (j = 0; j < r; ++j)
            scanf("%d", &req[i][j]);

    int done = 0;

    while (done < p) {
        int progress = 0;

        for (i = 0; i < p; ++i) {
            if (!finish[i]) {
                int can = 1;

                for (j = 0; j < r; ++j) {
                    if (req[i][j] > avail[j]) {
                        can = 0;
                        break;
                    }
                }

                if (can) {
                    printf("Process %d is satisfied\n", i + 1);

                    for (k = 0; k < r; ++k) {
                        avail[k] += alloc[i][k];
                        printf("Available[%d] = %d\n", k, avail[k]);
                    }

                    finish[i] = 1;
                    progress = 1;
                    done++;
                }
            }
        }

        if (!progress)
            break;
    }

    return 0;
}

//9
#include <stdio.h>

int main() {
    int memory, n;
    int start[50], length[50];
    int allocated[100] = {0};

    printf("Enter the total memory you want: ");
    scanf("%d", &memory);

    printf("Enter the total number of files: ");
    scanf("%d", &n);

    for (int i = 0; i < n; i++) {
        printf("Enter the starting block of file %d: ", i + 1);
        scanf("%d", &start[i]);

        printf("Enter the length of file %d: ", i + 1);
        scanf("%d", &length[i]);

        int flag = 0;

        for (int j = start[i]; j < start[i] + length[i]; j++) {
            if (j > memory || allocated[j]) {
                flag = 1;
                break;
            }
        }

        if (!flag) {
            for (int j = start[i]; j < start[i] + length[i]; j++)
                allocated[j] = 1;

            printf("File %d is allocated from block %d to %d\n",
                   i + 1, start[i], start[i] + length[i] - 1);
        } else {
            printf("File %d cannot be allocated\n", i + 1);
        }
    }

    return 0;
}


//10
#include <stdio.h>

int main() {
    int start, n;
    int index[50];

    printf("Enter the starting address of file: ");
    scanf("%d", &start);

    printf("Enter the number of blocks: ");
    scanf("%d", &n);

    for (int i = 0; i < n; i++) {
        printf("Enter index %d: ", i + 1);
        scanf("%d", &index[i]);
    }

    printf("\nFile starting address is: %d\n", start);
    printf("Indexed block locations are:\n");

    for (int i = 0; i < n; i++)
        printf("%d\n", index[i]);

    return 0;
}

//11
#include <stdio.h>
#include <string.h>

int main(void) {
    int n, i, j, pos, temp, time = 0;
    char pname[10][10], tname[10];
    int bt[10], wt[10], tat[10];
    int total_wt = 0, total_tat = 0;

    printf("Enter the number of processes: ");
    scanf("%d", &n);

    for (i = 0; i < n; ++i) {
        printf("Enter the process name %d: ", i);
        scanf("%9s", pname[i]);
        printf("Enter the burst time of process %d: ", i);
        scanf("%d", &bt[i]);
    }

    // Sort processes by burst time (SJF)
    for (i = 0; i < n - 1; ++i) {
        pos = i;
        for (j = i + 1; j < n; ++j)
            if (bt[j] < bt[pos])
                pos = j;

        if (pos != i) {
            temp = bt[i];
            bt[i] = bt[pos];
            bt[pos] = temp;

            strcpy(tname, pname[i]);
            strcpy(pname[i], pname[pos]);
            strcpy(pname[pos], tname);
        }
    }

    wt[0] = 0;
    for (i = 1; i < n; ++i)
        wt[i] = wt[i - 1] + bt[i - 1];

    for (i = 0; i < n; ++i) {
        tat[i] = wt[i] + bt[i];
        total_wt += wt[i];
        total_tat += tat[i];
    }

    printf("\nProcess\tBurst\tWaiting\tTurnaround\n");
    printf("=======\t=====\t=======\t==========\n");
    for (i = 0; i < n; ++i)
        printf("%s\t%d\t%d\t%d\n", pname[i], bt[i], wt[i], tat[i]);

    printf("\nTotal waiting time = %d", total_wt);
    printf("\nAverage waiting time = %.2f", (float)total_wt / n);
    printf("\nTotal turnaround time = %d", total_tat);
    printf("\nAverage turnaround time = %.2f\n", (float)total_tat / n);

    printf("\nGANTT CHART:\n");
    printf("-------------\n");
    for (i = 0; i < n; ++i)
        printf("| %s ", pname[i]);
    printf("|\n");

    time = 0;
    for (i = 0; i < n; ++i) {
        printf("%d\t", time);
        time += bt[i];
    }
    printf("%d\n", time);

    return 0;
}

//12
#include <stdio.h>
#include <string.h>

struct Process {
    char name[10];
    int bt, wt, tat;
};

int main() {
    int n, i, j;
    struct Process p[10], temp;
    int total_wt = 0, total_tat = 0;
    int time = 0;

    printf("Enter number of processes: ");
    scanf("%d", &n);

    for (i = 0; i < n; i++) {
        printf("Enter process name: ");
        scanf("%s", p[i].name);
        printf("Enter burst time: ");
        scanf("%d", &p[i].bt);
    }

    // Sort by burst time (SJF)
    for (i = 0; i < n - 1; i++) {
        for (j = i + 1; j < n; j++) {
            if (p[i].bt > p[j].bt) {
                temp = p[i];
                p[i] = p[j];
                p[j] = temp;
            }
        }
    }

    p[0].wt = 0;
    for (i = 1; i < n; i++)
        p[i].wt = p[i - 1].wt + p[i - 1].bt;

    for (i = 0; i < n; i++) {
        p[i].tat = p[i].wt + p[i].bt;
        total_wt += p[i].wt;
        total_tat += p[i].tat;
    }

    printf("\nProcess\tBT\tWT\tTAT\n");
    for (i = 0; i < n; i++)
        printf("%s\t%d\t%d\t%d\n",
               p[i].name, p[i].bt, p[i].wt, p[i].tat);

    printf("\nAverage Waiting Time = %.2f",
           (float)total_wt / n);
    printf("\nAverage Turnaround Time = %.2f\n",
           (float)total_tat / n);

    // Gantt Chart
    printf("\nGANTT CHART\n");
    for (i = 0; i < n; i++)
        printf("| %s ", p[i].name);
    printf("|\n0");

    for (i = 0; i < n; i++) {
        time += p[i].bt;
        printf("   %d", time);
    }
    printf("\n");

    return 0;
}

//13
#include <stdio.h>
#include <string.h>

struct Process {
    char name[10];
    int bt, rt, wt, tat;
};

int main() {
    int n, tq;
    struct Process p[10];
    int time = 0, completed = 0;
    int i;

    printf("Enter number of processes: ");
    scanf("%d", &n);

    printf("Enter time quantum: ");
    scanf("%d", &tq);

    for (i = 0; i < n; i++) {
        printf("Enter process name: ");
        scanf("%s", p[i].name);
        printf("Enter burst time: ");
        scanf("%d", &p[i].bt);

        p[i].rt = p[i].bt;
        p[i].wt = 0;
        p[i].tat = 0;
    }

    printf("\nGANTT CHART\n| ");

    while (completed < n) {
        for (i = 0; i < n; i++) {
            if (p[i].rt > 0) {
                printf("%s | ", p[i].name);

                if (p[i].rt > tq) {
                    time += tq;
                    p[i].rt -= tq;
                } else {
                    time += p[i].rt;
                    p[i].wt = time - p[i].bt;
                    p[i].rt = 0;
                    completed++;
                }
            }
        }
    }

    int total_wt = 0, total_tat = 0;

    printf("\n\nProcess\tBT\tWT\tTAT\n");
    for (i = 0; i < n; i++) {
        p[i].tat = p[i].wt + p[i].bt;
        total_wt += p[i].wt;
        total_tat += p[i].tat;

        printf("%s\t%d\t%d\t%d\n",
               p[i].name, p[i].bt, p[i].wt, p[i].tat);
    }

    printf("\nAverage Waiting Time = %.2f",
           (float)total_wt / n);
    printf("\nAverage Turnaround Time = %.2f\n",
           (float)total_tat / n);

    return 0;
}

//14
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>

#define MAX_PORTS 3
#define NUM_PROCESSES 5

struct {
    int av;
    pthread_mutex_t m;
    pthread_cond_t c;
} mon;

void* process(void* arg) {
    int id = *(int*)arg;

    pthread_mutex_lock(&mon.m);

    while (mon.av == 0) {
        printf("Process %d waiting for port...\n", id);
        pthread_cond_wait(&mon.c, &mon.m);
    }

    mon.av--;
    printf("Process %d opened port. Available ports = %d\n", id, mon.av);

    pthread_mutex_unlock(&mon.m);

    sleep(2);   // simulate port usage

    pthread_mutex_lock(&mon.m);

    mon.av++;
    printf("Process %d closed port. Available ports = %d\n", id, mon.av);

    pthread_cond_signal(&mon.c);
    pthread_mutex_unlock(&mon.m);

    return NULL;
}

int main() {
    pthread_t t[NUM_PROCESSES];
    int id[NUM_PROCESSES];

    mon.av = MAX_PORTS;
    pthread_mutex_init(&mon.m, NULL);
    pthread_cond_init(&mon.c, NULL);

    for (int i = 0; i < NUM_PROCESSES; i++) {
        id[i] = i + 1;
        pthread_create(&t[i], NULL, process, &id[i]);
    }

    for (int i = 0; i < NUM_PROCESSES; i++)
        pthread_join(t[i], NULL);

    pthread_mutex_destroy(&mon.m);
    pthread_cond_destroy(&mon.c);

    return 0;
}
