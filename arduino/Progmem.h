#ifndef _PROGMEM_H_
#define _PROGMEM_H_

#define __need_size_t
#include <stddef.h>

#include <io.h>

typedef char prog_char __attribute__ ((progmem));
typedef int prog_int __attribute__ ((progmem));
typedef long prog_long __attribute__ ((progmem));
typedef long long prog_long_long __attribute__ ((progmem));

#define PROGMEM __attribute__ ((progmem))
#define PSTR(s) ({static char c[] __attribute__ ((progmem)) = s;c;})

/* workaround for egcs-1.1.2 bug:
   load r31:r30 yourself, don't let the compiler do it */
#define __lpm_old_macro(addr) ({		\
	char t;					\
	asm volatile (				\
		"mov	r30, %A1" "\n\t"	\
		"mov	r31, %B1" "\n\t"	\
		"lpm" "\n\t"			\
		"mov	%0, r0"			\
		: "=r" (t)			\
		: "r" (addr)			\
		: "r30", "r31"			\
	);					\
	t;					\
})

/* this macro seems to work OK with gcc-2.95.1 -
   if not, use the one above */
#define __lpm_macro(addr) ({			\
	char t;					\
	asm volatile (				\
		"lpm" "\n\t"			\
		"mov	%0,r0"			\
		: "=r" (t)			\
		: "z" (addr)			\
	);					\
	t;					\
})

/* use this for access to >64K program memory (ATmega103),
   addr = RAMPZ:r31:r30 (if possible, put your constant tables in the
   lower 64K and use "lpm" - it is more efficient that way, and you can
   still use the upper 64K for executable code).  */
#define __elpm_macro(addr) ({			\
	char t;					\
	asm volatile (				\
		"mov	r30, %A1" "\n\t"	\
		"mov	r31, %B1" "\n\t"	\
		"out	%2, %C1" "\n\t"		\
		"elpm" "\n\t"			\
		"mov	%0, r0"			\
		: "=r" (t)			\
		: "r" (addr), "I" (RAMPZ)	\
		: "r30", "r31"			\
	);					\
	t;					\
})

static inline char __lpm_inline(unsigned int addr) __attribute__((const));
static inline char __lpm_inline(unsigned int addr)
{
	return __lpm_macro(addr);
}

#if (FLASHEND > 0xFFFFUL)  /* >64K program memory (ATmega103) */

static inline char __elpm_inline(unsigned long addr) __attribute__((const));
static inline char __elpm_inline(unsigned long addr)
{
	return __elpm_macro(addr);
}

#endif

// #define PRG_RDB(addr) __elpm_inline(addr)

#define PRG_RDB(addr) __lpm_macro(addr)


extern void progmem_read_block(void *dest, const prog_char *src, size_t n);

#endif /* _PROGMEM_H_ */
