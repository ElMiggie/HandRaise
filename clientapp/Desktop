CFLAGS = -g3 -Wall -Wextra -Wconversion -Wcast-qual -Wcast-align -g
CFLAGS += -Winline -Wfloat-equal -Wnested-externs
CFLAGS += -pedantic -std=gnu99 -Werror
CC = gcc
PROMPT = -DPROMPT
.PHONY: clean all

all: 33sh 33noprompt
33sh: sh.c
	$(CC) $(CFLAGS) $(PROMPT) sh.c -o 33sh
33noprompt: sh.c
	$(CC) $(CFLAGS) sh.c -o 33noprompt
clean:
	rm -f 33sh 33noprompt

